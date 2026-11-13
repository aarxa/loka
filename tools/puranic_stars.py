# Snap the stars named in the Puranic sky to the stars actually drawn (extracted from the NASA map), so rings sit on them.
import sys, json, math
stars = json.load(open(sys.argv[1]))['stars']
def hms(h, m, s=0): return (h + m / 60 + s / 3600) * 15
def dms(d, m, s=0): sg = -1 if d < 0 or str(d).startswith('-') else 1; return sg * (abs(d) + m / 60 + s / 3600)
# id, Sanskrit name, Western star, RA (deg), Dec (deg)
L = [
 # Dhruva and the seven sages (the Big Dipper), with Arundhati beside Vasishtha
 ('dhruva', 'Dhruva', 'Polaris', hms(2, 31, 49), dms(89, 15, 51)),
 ('kratu', 'Kratu', 'Dubhe', hms(11, 3, 44), dms(61, 45, 3)),
 ('pulaha', 'Pulaha', 'Merak', hms(11, 1, 50), dms(56, 22, 57)),
 ('pulastya', 'Pulastya', 'Phecda', hms(11, 53, 50), dms(53, 41, 41)),
 ('atri', 'Atri', 'Megrez', hms(12, 15, 26), dms(57, 1, 57)),
 ('angiras', 'Angiras', 'Alioth', hms(12, 54, 2), dms(55, 57, 35)),
 ('vasishtha', 'Vasishtha', 'Mizar', hms(13, 23, 56), dms(54, 55, 31)),
 ('marichi', 'Marichi', 'Alkaid', hms(13, 47, 32), dms(49, 18, 48)),
 ('arundhati', 'Arundhati', 'Alcor', hms(13, 25, 14), dms(54, 59, 17)),
 # the nakshatras, by their junction stars (yogataras); Abhijit is the 28th
 ('n1', 'Ashvini', 'β Arietis', hms(1, 54, 39), dms(20, 48, 29)),
 ('n2', 'Bharani', '41 Arietis', hms(2, 49, 59), dms(27, 15, 38)),
 ('n3', 'Krittika', 'the Pleiades', hms(3, 47, 29), dms(24, 6, 18)),
 ('n4', 'Rohini', 'Aldebaran', hms(4, 35, 55), dms(16, 30, 33)),
 ('n5', 'Mrigashira', 'λ Orionis', hms(5, 35, 8), dms(9, 56, 3)),
 ('n6', 'Ardra', 'Betelgeuse', hms(5, 55, 10), dms(7, 24, 25)),
 ('n7', 'Punarvasu', 'Pollux', hms(7, 45, 19), dms(28, 1, 34)),
 ('n8', 'Pushya', 'δ Cancri', hms(8, 44, 41), dms(18, 9, 15)),
 ('n9', 'Ashlesha', 'ε Hydrae', hms(8, 46, 47), dms(6, 25, 8)),
 ('n10', 'Magha', 'Regulus', hms(10, 8, 22), dms(11, 58, 2)),
 ('n11', 'Purva Phalguni', 'Zosma', hms(11, 14, 6), dms(20, 31, 25)),
 ('n12', 'Uttara Phalguni', 'Denebola', hms(11, 49, 4), dms(14, 34, 19)),
 ('n13', 'Hasta', 'δ Corvi', hms(12, 29, 52), dms(-16, 30, 56)),
 ('n14', 'Chitra', 'Spica', hms(13, 25, 12), dms(-11, 9, 41)),
 ('n15', 'Swati', 'Arcturus', hms(14, 15, 40), dms(19, 10, 57)),
 ('n16', 'Vishakha', 'α Librae', hms(14, 50, 53), dms(-16, 2, 30)),
 ('n17', 'Anuradha', 'δ Scorpii', hms(16, 0, 20), dms(-22, 37, 18)),
 ('n18', 'Jyeshtha', 'Antares', hms(16, 29, 24), dms(-26, 25, 55)),
 ('n19', 'Mula', 'λ Scorpii', hms(17, 33, 36), dms(-37, 6, 14)),
 ('n20', 'Purva Ashadha', 'δ Sagittarii', hms(18, 20, 60), dms(-29, 49, 41)),
 ('n21', 'Uttara Ashadha', 'σ Sagittarii', hms(18, 55, 16), dms(-26, 17, 48)),
 ('n22', 'Abhijit', 'Vega', hms(18, 36, 56), dms(38, 47, 1)),
 ('n23', 'Shravana', 'Altair', hms(19, 50, 47), dms(8, 52, 6)),
 ('n24', 'Dhanishtha', 'β Delphini', hms(20, 37, 33), dms(14, 35, 43)),
 ('n25', 'Shatabhisha', 'λ Aquarii', hms(22, 52, 37), dms(-7, 34, 47)),
 ('n26', 'Purva Bhadrapada', 'Markab', hms(23, 4, 46), dms(15, 12, 19)),
 ('n27', 'Uttara Bhadrapada', 'Algenib', hms(0, 13, 14), dms(15, 11, 1)),
 ('n28', 'Revati', 'ζ Piscium', hms(1, 13, 44), dms(7, 34, 31)),
]
def vec(ra, de):
    a, d = math.radians(ra), math.radians(de); return (math.cos(d) * math.cos(a), math.sin(d), -math.cos(d) * math.sin(a))
SV = [(vec(s[0], s[1]), s) for s in stars]
out = []
for sid, name, west, ra, de in L:
    v = vec(ra, de); best = None
    for w, s in SV:
        c = v[0] * w[0] + v[1] * w[1] + v[2] * w[2]
        if c > math.cos(math.radians(0.6)):
            sc = s[2] + 0.4 * c   # prefer the brightest star very near the catalogue position
            if best is None or sc > best[0]: best = (sc, c, s)
    if best:
        _, c, s = best; sep = math.degrees(math.acos(min(1, c)))
        print('%-10s %-17s %-13s cat (%7.2f %6.2f)  drawn (%7.2f %6.2f) sep %.2f°  bright %.2f' % (sid, name, west, ra, de, s[0], s[1], sep, s[2]))
        out.append([sid, name, west, round(s[0], 2), round(s[1], 2)])
    else:
        print('%-10s %-17s %-13s NOT FOUND near (%7.2f %6.2f)' % (sid, name, west, ra, de))
        out.append([sid, name, west, round(ra, 2), round(de, 2)])
json.dump(out, open(sys.argv[2], 'w'), ensure_ascii=False, separators=(',', ':'))
