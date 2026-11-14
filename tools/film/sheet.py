# contact sheet: sheet.py out.jpg cols tile_w file1 file2 ...
import sys
from PIL import Image, ImageDraw
out, cols, tw = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]); files = sys.argv[4:]
ims = [Image.open(f) for f in files]; th = round(tw * ims[0].height / ims[0].width); rows = -(-len(ims) // cols)
sh = Image.new('RGB', (cols * tw, rows * th), (40, 40, 40)); d = ImageDraw.Draw(sh)
for i, (f, im) in enumerate(zip(files, ims)):
    x, y = i % cols * tw, i // cols * th; sh.paste(im.resize((tw, th)), (x, y)); d.text((x + 6, y + 4), f.split('/')[-1], fill=(255, 255, 0))
sh.save(out, quality=88)
