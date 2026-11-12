#!/usr/bin/env python3
"""Cut the south Puget Sound out of GSHHG full-resolution shorelines (github.com/GenericMappingTools/gshhg-gmt, GSHHS/res_f/*.txt)
into region.json for tools/make-geo.py. Usage: gshhg-extract.py GSHHS_f_NAmerica.txt GSHHS_f_Level_1a.txt GSHHS_f_Level_1b.txt GSHHS_f_Level_2.txt"""
import re,json,sys
BB=(237.0,237.8,46.95,47.75)   # south Puget Sound up to Seattle, and Olympia
def polys(fn):
    cur=None;keep=False
    for line in open(fn):
        if line[0]=='>':
            if cur and keep: yield hdr,cur
            m=re.search(r"Id = (\d+) N = (\d+).*?L = (\d).*R = ([-\d.]+)/([-\d.]+)/([-\d.]+)/([-\d.]+)",line)
            w,e,s,n=map(float,m.groups()[3:]);hdr=(int(m.group(1)),int(m.group(3)),int(m.group(2)))
            keep=e>BB[0] and w<BB[1] and n>BB[2] and s<BB[3];cur=[]
        elif keep:
            x,y=map(float,line.split());cur.append((x,y))
    if cur and keep: yield hdr,cur
def clip(pts,BB):
    def ci(p,inside,inter):
        out=[]
        for i in range(len(p)):
            a,b=p[i-1],p[i]
            if inside(b):
                if not inside(a): out.append(inter(a,b))
                out.append(b)
            elif inside(a): out.append(inter(a,b))
        return out
    x0,x1,y0,y1=BB
    def ix(xv):return lambda a,b:(xv,a[1]+(b[1]-a[1])*(xv-a[0])/(b[0]-a[0]))
    def iy(yv):return lambda a,b:(a[0]+(b[0]-a[0])*(yv-a[1])/(b[1]-a[1]),yv)
    p=pts
    for ins,inter in [(lambda q:q[0]>=x0,ix(x0)),(lambda q:q[0]<=x1,ix(x1)),(lambda q:q[1]>=y0,iy(y0)),(lambda q:q[1]<=y1,iy(y1))]:
        p=ci(p,ins,inter)
        if not p:break
    return p
out=[]
for fn in sys.argv[1:]:
    for (i,L,n),pts in polys(fn):
        c=clip(pts,BB)
        if len(c)>2: out.append({'id':i,'level':L,'n':n,'pts':[(round(x-360,5),round(y,5)) for x,y in c]})
        print(fn.split('/')[-1],i,L,n,len(c),file=sys.stderr)
json.dump(out,open('region.json','w'))
