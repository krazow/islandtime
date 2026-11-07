from PIL import Image, ImageDraw
def draw(n):
    S=512;im=Image.new('RGBA',(S,S),(0,0,0,0));d=ImageDraw.Draw(im)
    d.rounded_rectangle([0,0,S-1,S-1],radius=110,fill=(29,75,90,255))
    d.rectangle([0,0,S,250],fill=(159,188,196,255))
    d.rounded_rectangle([0,0,S-1,260],radius=110,fill=(159,188,196,255)); d.rectangle([0,150,S,260],fill=(159,188,196,255))
    d.polygon([(250,255),(350,120),(372,140),(390,125),(500,255)],fill=(233,238,240,255))
    for i,x in enumerate(range(-20,520,60)):
        h=120+(i*37)%70; d.polygon([(x,262),(x+30,262-h),(x+60,262)],fill=(47,93,74,255))
    d.rectangle([0,258,S,268],fill=(47,93,74,255))
    d.rounded_rectangle([80,330,432,380],radius=10,fill=(244,241,234,255))
    d.rectangle([80,372,432,392],fill=(47,93,74,255))
    d.rectangle([200,290,312,332],fill=(244,241,234,255)); d.rectangle([212,300,300,314],fill=(42,61,69,255))
    d.rectangle([244,252,268,292],fill=(227,100,46,255))
    d.line([(40,430),(472,430)],fill=(255,255,255,40),width=6)
    # rounded mask
    m=Image.new('L',(S,S),0);ImageDraw.Draw(m).rounded_rectangle([0,0,S-1,S-1],radius=110,fill=255)
    im.putalpha(m)
    return im.resize((n,n),Image.LANCZOS)
im=draw(256)
im.save('icon.ico',sizes=[(16,16),(24,24),(32,32),(48,48),(64,64),(128,128),(256,256)],bitmap_format='bmp')
im.save('icon.png')
