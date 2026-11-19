#!/usr/bin/env python3
"""Superpose les tracés de src/data/strokes.json sur la police Noto Sans Armenian.

Usage : python3 scripts/preview-strokes.py src/data/strokes.json "Ա,Բ,ա" out.png
        python3 scripts/preview-strokes.py src/data/strokes.json out.png   (tout)
Nécessite Pillow et la police Noto Sans Armenian installée (/usr/share/fonts/truetype/noto).
"""
import sys, json, re
from PIL import Image, ImageDraw, ImageFont
data = json.load(open(sys.argv[1])); keys = sys.argv[2].split(',') if len(sys.argv)>3 else list(data); out = sys.argv[-1]
S=3
font = ImageFont.truetype('/usr/share/fonts/truetype/noto/NotoSansArmenian-Regular.ttf', 75*S)
lab = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 10)
def sample(d):
    toks = re.findall(r'[MLCQ]|-?[\d.]+', d); pts=[]; i=0; cur=None; cmd=None
    while i < len(toks):
        if toks[i] in 'MLCQ': cmd=toks[i]; i+=1
        n={'M':2,'L':2,'Q':4,'C':6}[cmd]; v=[float(x) for x in toks[i:i+n]]; i+=n
        if cmd=='M': cur=(v[0],v[1]); pts.append(cur); cmd='L'
        elif cmd=='L': cur=(v[0],v[1]); pts.append(cur)
        elif cmd=='Q':
            p0=cur
            for k in range(1,21):
                t=k/20; pts.append(((1-t)**2*p0[0]+2*(1-t)*t*v[0]+t*t*v[2],(1-t)**2*p0[1]+2*(1-t)*t*v[1]+t*t*v[3]))
            cur=(v[2],v[3])
        elif cmd=='C':
            p0=cur
            for k in range(1,21):
                t=k/20; a=(1-t)**3; b=3*(1-t)**2*t; c=3*(1-t)*t*t; e=t**3
                pts.append((a*p0[0]+b*v[0]+c*v[2]+e*v[4], a*p0[1]+b*v[1]+c*v[3]+e*v[5]))
            cur=(v[4],v[5])
    return pts
cols=min(6,len(keys)); rows=(len(keys)+cols-1)//cols; W=100*S+10
img=Image.new('RGB',(cols*W,rows*W),'white'); d=ImageDraw.Draw(img)
colors=[(220,0,0),(0,140,0),(0,0,230),(200,0,200),(0,160,160),(230,130,0)]
for i,k in enumerate(keys):
    ox,oy=(i%cols)*W+5,(i//cols)*W+5
    d.rectangle([ox,oy,ox+100*S,oy+100*S],outline=(200,200,200))
    d.line([(ox,oy+70*S),(ox+100*S,oy+70*S)],fill=(255,200,200))
    w=font.getlength(k); d.text((ox+50*S-w/2,oy+70*S),k,font=font,fill=(190,190,190),anchor='ls')
    for si,s in enumerate(data.get(k,[])):
        p=[(ox+x*S,oy+y*S) for x,y in sample(s)]; col=colors[si%6]
        d.line(p,fill=col,width=3); d.ellipse([p[0][0]-5,p[0][1]-5,p[0][0]+5,p[0][1]+5],outline=col,width=2)
        d.text((p[0][0]+6,p[0][1]-12),str(si+1),fill=col,font=lab)
img.save(out)
