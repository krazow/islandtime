import struct,sys
def build(ico_path, manifest, out):
    ico=open(ico_path,'rb').read()
    _,_,n=struct.unpack_from('<HHH',ico,0)
    imgs=[]
    for i in range(n):
        w,h,cc,r,pl,bpp,size,off=struct.unpack_from('<BBBBHHII',ico,6+16*i)
        imgs.append((w,h,cc,pl,bpp,ico[off:off+size]))
    grp=struct.pack('<HHH',0,1,n)+b''.join(struct.pack('<BBBBHHIH',w,h,cc,0,pl,bpp,len(d),i+1) for i,(w,h,cc,pl,bpp,d) in enumerate(imgs))
    # resources: type -> list of (id, data)
    res={3:[(i+1,d[5]) for i,d in enumerate(imgs)],14:[(1,grp)],24:[(1,manifest)]}
    types=sorted(res)
    # compute layout
    dirs=[]  # build bytes after computing offsets
    lvl1_size=16+8*len(types)
    lvl2_sizes=[16+8*len(res[t]) for t in types]
    nleaf=sum(len(res[t]) for t in types)
    lvl3_size=16+8  # each leaf dir has one language entry
    off=lvl1_size
    lvl2_off=[];
    for s in lvl2_sizes: lvl2_off.append(off); off+=s
    lvl3_off=[];
    for _ in range(nleaf): lvl3_off.append(off); off+=lvl3_size
    de_off=[]
    for _ in range(nleaf): de_off.append(off); off+=16
    data_off=[]; blobs=[]
    leaves=[(t,i,d) for t in types for (i,d) in res[t]]
    for (t,i,d) in leaves:
        off=(off+7)&~7; data_off.append(off); off+=len(d)
    total=(off+7)&~7
    buf=bytearray(total)
    def dirhdr(o,nid): struct.pack_into('<IIHHHH',buf,o,0,0,0,0,0,nid)
    dirhdr(0,len(types))
    for k,t in enumerate(types): struct.pack_into('<II',buf,16+8*k,t,0x80000000|lvl2_off[k])
    li=0
    for k,t in enumerate(types):
        o=lvl2_off[k]; dirhdr(o,len(res[t]))
        for j,(rid,d) in enumerate(res[t]):
            struct.pack_into('<II',buf,o+16+8*j,rid,0x80000000|lvl3_off[li]); li+=1
    relocs=[]
    for li,(t,i,d) in enumerate(leaves):
        o=lvl3_off[li]; dirhdr(o,1); struct.pack_into('<II',buf,o+16,0x0409,de_off[li])
        struct.pack_into('<IIII',buf,de_off[li],data_off[li],len(d),0,0); relocs.append(de_off[li])
        buf[data_off[li]:data_off[li]+len(d)]=d
    nrel=len(relocs)
    raw_ptr=20+40; rel_ptr=raw_ptr+total; sym_ptr=rel_ptr+10*nrel
    fh=struct.pack('<HHIIIHH',0x8664,1,0,sym_ptr,1,0,0)
    sh=struct.pack('<8sIIIIIIHHI',b'.rsrc',0,0,total,raw_ptr,rel_ptr,0,nrel,0,0x40000040)
    rel=b''.join(struct.pack('<IIH',r,0,3) for r in relocs)
    sym=struct.pack('<8sIhHBB',b'.rsrc',0,1,0,3,0)
    open(out,'wb').write(fh+sh+bytes(buf)+rel+sym+struct.pack('<I',4))
manifest=b'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<assembly xmlns="urn:schemas-microsoft-com:asm.v1" manifestVersion="1.0">
  <assemblyIdentity type="win32" name="IslandTime.App" version="1.0.0.0" processorArchitecture="*"/>
  <trustInfo xmlns="urn:schemas-microsoft-com:asm.v3"><security><requestedPrivileges><requestedExecutionLevel level="asInvoker" uiAccess="false"/></requestedPrivileges></security></trustInfo>
  <dependency><dependentAssembly><assemblyIdentity type="win32" name="Microsoft.Windows.Common-Controls" version="6.0.0.0" processorArchitecture="*" publicKeyToken="6595b64144ccf1df" language="*"/></dependentAssembly></dependency>
  <application xmlns="urn:schemas-microsoft-com:asm.v3"><windowsSettings>
    <dpiAware xmlns="http://schemas.microsoft.com/SMI/2005/WindowsSettings">true/pm</dpiAware>
    <dpiAwareness xmlns="http://schemas.microsoft.com/SMI/2016/WindowsSettings">PerMonitorV2</dpiAwareness>
  </windowsSettings></application>
  <compatibility xmlns="urn:schemas-microsoft-com:compatibility.v1"><application><supportedOS Id="{8e0f7a12-bfb3-4fe8-b9a5-48fd50a15a9a}"/></application></compatibility>
</assembly>'''
build(sys.argv[1],manifest,sys.argv[2])
