// Loka: the words. The ages, the fourteen worlds in the order you fall through them, and read mode's notes.
// Each stop also sets where the camera goes: height (y), distance, height above (h), angle and fog.

export const S = 40;   // the spacing between worlds, in scene units

export const YUGAS = [
  { name:'Satya', alt:'also called Krita · 1,728,000 years', years:'1,728,000', frac:.4, legs:4,
    legnote:'Dharma stands on all four legs: austerity, purity, compassion and truth.', legsrc:'Bhagavata 1.17.24',
    vname:'White', swatch:'#f4efe2', accent:'#f4efe2', tint:'#fff1d6', bg:'#0c0b13',
    avatars:['Matsya','Kurma','Varaha','Narasimha'],
    thread:'Born as Hiranyaksha and Hiranyakashipu, slain by Varaha and Narasimha.',
    stories:[
      {t:'Narasimha', d:'A boon with no loophole, and the god who honored every word of it.', s:'Bhagavata Purana 7.2–7.10', },
      {t:'The churning of the ocean', d:'Devas and asuras pull on Vasuki. Kurma holds up the mountain.', s:'Bhagavata Purana 8.5–8.11'},
      {t:'Varaha lifts the earth', d:'The boar dives into the cosmic waters for the drowned earth.', s:'Bhagavata Purana 3.13, 3.18–3.19'} ] },
  { name:'Treta', alt:'1,296,000 years', years:'1,296,000', frac:.3, legs:3,
    legnote:'Dharma has lost a leg. Three remain.', legsrc:'Mahabharata 3.148',
    vname:'Red', swatch:'#c8402c', accent:'#ff8a6b', tint:'#ff5b3d', bg:'#13080a',
    avatars:['Vamana','Parashurama','Rama'],
    thread:'Born as Ravana and Kumbhakarna, slain by Rama.',
    stories:[
      {t:'The Ramayana', d:'Exile, abduction, a bridge to Lanka, and the cost of being an ideal king.', s:'Valmiki Ramayana'},
      {t:'Vamana’s three steps', d:'A dwarf asks King Bali for three paces of land.', s:'Bhagavata Purana 8.18–8.22'},
      {t:'Parashurama', d:'The Brahmin with an axe who rid the earth of kings.', s:'Bhagavata Purana 9.15–9.16'} ] },
  { name:'Dvapara', alt:'864,000 years', years:'864,000', frac:.2, legs:2,
    legnote:'Two legs remain.', legsrc:'Mahabharata 3.148',
    vname:'Yellow', swatch:'#e3b23c', accent:'#f2c94c', tint:'#ffc23a', bg:'#110d06',
    avatars:['Krishna','Balarama¹'],
    thread:'Born as Shishupala and Dantavakra, slain by Krishna.',
    stories:[
      {t:'The Mahabharata', d:'Cousins, a dice game, and a war that ends an age.', s:'Vyasa, Mahabharata'},
      {t:'Krishna in Vrindavan', d:'The butter thief, the serpent Kaliya, the lifted hill.', s:'Bhagavata Purana book 10'},
      {t:'Hanuman meets Bhima', d:'An old monkey from the last age blocks the path with his tail.', s:'Mahabharata 3.146–3.150'} ] },
  { name:'Kali', alt:'432,000 years · the age we live in', years:'432,000', frac:.1, legs:1,
    legnote:'One leg remains: only truth.', legsrc:'Bhagavata 1.17.25',
    vname:'Black', swatch:'#15161f', accent:'#9aa6e6', tint:'#4a5bb8', bg:'#050509',
    avatars:['Buddha¹','Kalki (to come)'],
    thread:'Their three births done, Jaya and Vijaya return to Vaikuntha.',
    stories:[
      {t:'Parikshit and the one-legged bull', d:'A king finds Dharma, as a bull, standing on a single leg.', s:'Bhagavata Purana 1.16–1.17'},
      {t:'The coming of Kalki', d:'A rider at the very end of the age.', s:'Bhagavata Purana 12.2'} ] },
];

export const OCEANS = [['Salt','#2a7fa8'],['Sugarcane juice','#b8c56a'],['Wine','#8a2a4c'],['Ghee','#e2b04a'],['Curd','#e8e0cc'],['Milk','#f7f4ec'],['Fresh water','#5aa9d8']];

export const STOPS = [
  { id:'intro', nav:'The cosmic egg', grp:'a', cls:'intro', y:-50, dist:700, h:30, ang:-0.5, fog:0.0004,
    kicker:'The Puranic cosmos', title:'Fourteen worlds.<br>One universe.',
    body:`<p>A map of the universe as the Puranas describe it: an egg that holds fourteen worlds, seven rising from the earth and seven below it.</p><p>Scroll to fall through them, from Brahma’s world down to the serpent who holds them all.</p><div class="hint"><i></i>Scroll to descend</div>`,
    src:'Vishnu Purana 2.2–2.7 · Bhagavata Purana 5.16–5.25' },

  { id:'satya', nav:'Satyaloka', grp:'up', y:6*S, dist:52, h:18, ang:.35, fog:.008,
    kicker:'Upper world 7 of 7 · the highest', title:'Satyaloka', deva:'सत्यलोक', iast:'Satyaloka · also Brahmaloka',
    body:`<p>The world of Brahma, highest of all. The Vishnu Purana says that those who live here never again know death.</p>`,
    src:'Vishnu Purana 2.7' },
  { id:'tapa', nav:'Tapoloka', grp:'up', y:5*S, dist:58, h:24, ang:.8, fog:.008,
    kicker:'Upper world 6 of 7', title:'Tapoloka', deva:'तपोलोक', iast:'Tapoloka',
    body:`<p>Home of the Vaibhraja gods, who cannot be burned by the fire that ends the world.</p>`,
    src:'Vishnu Purana 2.7' },
  { id:'jana', nav:'Janaloka', grp:'up', y:4*S, dist:64, h:28, ang:1.25, fog:.008,
    kicker:'Upper world 5 of 7', title:'Janaloka', deva:'जनलोक', iast:'Janaloka',
    body:`<p>Home of Sanandana and the other mind-born sons of Brahma. Four of these eternal child-sages once came to Vaikuntha and were turned away at the gate. They cursed the two doorkeepers to be born on earth, three times over.</p>`,
    links:[{label:'The curse at Vaikuntha’s gate'}],
    src:'Vishnu Purana 2.7 · Bhagavata Purana 3.15–3.16' },
  { id:'mahar', nav:'Maharloka', grp:'up', y:3*S, dist:64, h:24, ang:1.7, fog:.008,
    kicker:'Upper world 4 of 7', title:'Maharloka', deva:'महर्लोक', iast:'Maharloka',
    body:`<p>Above the pole star. Those who live here last through an entire day of Brahma. When the fires of dissolution rise, they withdraw upward to Janaloka.</p>`,
    versions:'The Vayu Purana, the most detailed account of these worlds, makes Maharloka the home of the rulers of the kalpa; a commentator names them as Bhrigu and the other patriarchs.',
    src:'Vishnu Purana 1.3, 2.7' },
  { id:'svar', nav:'Svarloka', grp:'up', y:2*S, dist:68, h:24, ang:2.1, fog:.008,
    kicker:'Upper world 3 of 7', title:'Svarloka', deva:'स्वर्लोक', iast:'Svarloka · Svarga',
    body:`<p>Svarga, the heaven of Indra and the devas, which stretches from the sun up to Dhruva, the pole star.</p><p>Dhruva was once a five-year-old boy. His devotion earned him the one fixed point the whole sky turns around.</p>`,
    links:[{label:'Dhruva’s devotion'}],
    src:'Vishnu Purana 2.7 · Bhagavata Purana 4.8–4.9' },
  { id:'bhuvar', nav:'Bhuvarloka', grp:'up', y:1*S, dist:68, h:20, ang:2.5, fog:.008,
    kicker:'Upper world 2 of 7', title:'Bhuvarloka', deva:'भुवर्लोक', iast:'Bhuvarloka',
    body:`<p>The open sky between the earth and the sun, where siddhas and sages travel.</p>`,
    src:'Vishnu Purana 2.7' },

  { id:'bhu', nav:'Bhurloka · Earth', rail:'Bhurloka', grp:'earth', y:0, dist:122, h:86, ang:2.85, fog:.0035,
    kicker:'Upper world 1 of 7 · Earth', title:'Bhurloka', deva:'भूर्लोक', iast:'Bhūrloka · Bhū-maṇḍala',
    body:`<p>In the Puranas, the earth is a lotus. Mount Meru is its seed-cup, and it is wider at the summit than at the base.</p><p>Around it lie seven ring-shaped continents: Jambu, Plaksha, Shalmali, Kusha, Krauncha, Shaka and Pushkara. An ocean circles each one. Beyond the last ocean rise the Lokaloka mountains, where light ends.</p>`,
    versions:'Four mountains brace Meru on each side. The Vishnu Purana (2.2) names them Mandara, Gandhamadana, Vipula and Suparshva; the Bhagavata (5.16) gives a different list.</p><p>Jain and Buddhist cosmology share this picture. Jain texts set Meru at the center of Jambudvipa, ringed by oceans and continents in turn; Buddhist texts ring Meru with seven golden mountain ranges and seas, with the continents in the ocean beyond and Jambudvipa to the south.',
    extra:`<div class="legend"><div class="label">The seven oceans, inside to out</div><ul>${OCEANS.map(o=>`<li><i style="background:${o[1]}"></i>${o[0]}</li>`).join('')}</ul></div>`,
    src:'Vishnu Purana 2.2, 2.4' },
  { id:'bharata', nav:'Bharata', grp:'earth', y:0, dist:44, h:20, ang:Math.PI, fog:.005, look:[0,3,-4],
    kicker:'Jambudvipa · the southern land', title:'Bharata', deva:'भारतवर्ष', iast:'Bhāratavarṣa',
    body:`<p>South of the Himalaya lies Bharata. The Vishnu Purana calls it the land of action: the one place where deeds bear fruit. Every age’s stories play out here.</p>`,
    extra:`<div id="stories"></div>`,
    src:'Vishnu Purana 2.3' },

  { id:'atala', nav:'Atala', grp:'low', y:-1*S, dist:62, h:22, ang:3.6, fog:.009,
    kicker:'Lower world 1 of 7', title:'Atala', deva:'अतल', iast:'Atala',
    body:`<p>The first of the seven worlds below the earth, ruled by Bala, a son of the asura architect Maya.</p><p>There is no sun down here, and no day or night. Light comes from the jewels on the serpents’ hoods.</p>`,
    versions:'The Vishnu Purana (2.5) names the seven lower worlds differently: Atala, Vitala, Nitala, Gabhastimat, Mahatala, Sutala and Patala. This descent follows the Bhagavata.',
    src:'Bhagavata Purana 5.24.7–5.24.16' },
  { id:'vitala', nav:'Vitala', grp:'low', y:-2*S, dist:62, h:22, ang:3.95, fog:.009,
    kicker:'Lower world 2 of 7', title:'Vitala', deva:'वितल', iast:'Vitala',
    body:`<p>Shiva lives here as Hatakeshvara, with Bhavani. The river Hataki flows through it, running with gold.</p>`,
    src:'Bhagavata Purana 5.24.17' },
  { id:'sutala', nav:'Sutala', grp:'low', y:-3*S, dist:62, h:22, ang:4.3, fog:.009,
    kicker:'Lower world 3 of 7', title:'Sutala', deva:'सुतल', iast:'Sutala',
    body:`<p>The kingdom of Bali, the asura king who gave everything away. After Vamana took the three worlds in three steps, he gave Bali this realm. The Bhagavata says Vishnu himself stands guard at its gate.</p>`,
    links:[{label:'Vamana’s three steps', yuga:1}],
    src:'Bhagavata Purana 5.24.18–5.24.27, 8.22' },
  { id:'talatala', nav:'Talatala', grp:'low', y:-4*S, dist:62, h:22, ang:4.65, fog:.009,
    kicker:'Lower world 4 of 7', title:'Talatala', deva:'तलातल', iast:'Talātala',
    body:`<p>The realm of Maya, the great builder of the asuras. After Shiva burned Maya’s three flying cities, he gave him this kingdom.</p>`,
    links:[{label:'The burning of Tripura'}],
    src:'Bhagavata Purana 5.24.28' },
  { id:'mahatala', nav:'Mahatala', grp:'low', y:-5*S, dist:62, h:22, ang:5.0, fog:.009,
    kicker:'Lower world 5 of 7', title:'Mahatala', deva:'महातल', iast:'Mahātala',
    body:`<p>Home of the many-hooded serpents, the sons of Kadru, who live in constant fear of Garuda.</p>`,
    links:[{label:'Garuda steals the nectar'}],
    src:'Bhagavata Purana 5.24.29' },
  { id:'rasatala', nav:'Rasatala', grp:'low', y:-6*S, dist:62, h:22, ang:5.35, fog:.009,
    kicker:'Lower world 6 of 7', title:'Rasatala', deva:'रसातल', iast:'Rasātala',
    body:`<p>The fortress of the Daityas and Danavas, old enemies of the devas: the Panis, the Nivatakavachas and the Kaleyas. Ages later, Arjuna will fight the Nivatakavachas.</p>`,
    links:[{label:'Arjuna fights the Nivatakavachas', yuga:2}],
    versions:'The Mahabharata (3.165–3.172) puts the Nivatakavachas’ city beneath the sea.',
    src:'Bhagavata Purana 5.24.30' },
  { id:'patala', nav:'Patala', grp:'low', y:-7*S, dist:62, h:22, ang:5.7, fog:.009,
    kicker:'Lower world 7 of 7 · the deepest', title:'Patala', deva:'पाताल', iast:'Pātāla · Nāgaloka',
    body:`<p>The world of the nagas, ruled by Vasuki. The jewels on their hoods light the dark. When the sage Narada came back from Patala, he said it was lovelier than heaven.</p>`,
    links:[{label:'Vasuki, rope of the churning', yuga:0}],
    src:'Bhagavata Purana 5.24.31 · Vishnu Purana 2.5' },

  { id:'shesha', nav:'Ananta Shesha', grp:'base', y:-8.5*S, dist:100, h:36, ang:6.2, fog:.004, look:[0,-8.5*S+12,0],
    kicker:'Beneath all worlds', title:'Ananta Shesha', deva:'अनन्त शेष', iast:'Ananta Śeṣa',
    body:`<p>Below everything lies Ananta, the endless serpent. The Bhagavata says the whole universe rests on one of his thousand hoods like a mustard seed. Vishnu sleeps on his coils.</p><p>Many traditions say he came to earth as Lakshmana, and again as Balarama.</p>`,
    links:[{label:'Lakshmana', yuga:1},{label:'Balarama', yuga:2}],
    src:'Bhagavata Purana 5.25 · Vishnu Purana 2.5' },

  { id:'end', nav:'A day of Brahma', grp:'z', cls:'end', y:-50, dist:860, h:-40, ang:7.0, fog:.0004,
    kicker:'And then', title:'A day of Brahma.',
    body:`<p>A thousand turns of the four ages make one day of Brahma: 4.32 billion years. Then the worlds dissolve, and it all begins again.</p>
      <div class="ctas"><button class="cta" id="waitBtn">Join the waitlist</button></div><p class="note" id="waitNote"></p>`,
    src:'Vishnu Purana 1.3' },
];

// Read mode only: a guide to the map, and a deeper note for each world
export const DEEP = {
  intro:`<h3>Where the fourteen worlds come from</h3>
    <p>The oldest Vedic hymns speak of three worlds: the earth, the sky, and heaven above it. Their names, <i>bhuh</i>, <i>bhuvah</i> and <i>svah</i>, open the Gayatri mantra, which many Hindus still recite every day. Later Vedic texts add four more names above them, <i>mahah</i>, <i>janah</i>, <i>tapah</i> and <i>satyam</i>, and the Puranas set seven more worlds beneath the earth. Together they make fourteen, sealed inside the <i>Brahmanda</i>, the egg of Brahma.</p>
    <p>The Puranas are long Sanskrit works of cosmology, genealogy and story, compiled over many centuries in the first millennium CE. This map follows two of them most closely: the Vishnu Purana (book 2) for the overall shape, and the Bhagavata Purana (book 5) for the lower worlds and the serpent beneath them.</p>
    <h3>How to read it</h3>
    <p>The texts measure everything in <i>yojanas</i> and describe each world in detail, but they don’t always agree with each other, and many traditions read the whole picture symbolically, as levels of being rather than places. Where the texts differ, this map follows one and says so in a Versions note.</p>
    <p>Two things surprise most readers. The worlds below the earth are not hells: they’re described as richer and lovelier than heaven, and the hells are a separate place. And nothing here lasts forever: at the end of each day of Brahma, the three nearest worlds, earth, sky and heaven, burn and are made again.</p>
    <h3>What’s from the texts, and what’s drawn</h3>
    <p>The names, the order, the egg, Mount Meru wider at its summit than its base, the seven ring-shaped oceans and Ananta Shesha holding it all up come from the texts. The look of each world as a glowing galaxy, the glass of the egg, the colors and the spacing are this map’s own. The real proportions are far too vast to draw.</p>`,
  satya:`<p>Also called Brahmaloka, this is the seat of Brahma, the creator, at the top of the egg. The Vishnu Purana places it high above Dhruva, beyond Mahar, Jana and Tapa, and says those who reach it never again know death.</p>
    <p>Many traditions add that when Brahma’s life of a hundred years comes to an end, those who live here are freed along with him instead of being born again.</p>`,
  tapa:`<p><i>Tapas</i> means heat, and the inner heat of austerity: the discipline that, in these stories, gives sages and even gods their power. The Vaibhrajas who live here (other texts call them Vairajas) are beyond the reach of the fire that ends each day of Brahma.</p>`,
  jana:`<p><i>Jana</i> means people, or beings. The best-known residents are the four Kumaras, Sanaka, Sanandana, Sanatana and Sanatkumara: sons born from Brahma’s mind who chose to stay children forever, given to study and meditation.</p>
    <p>Their visit to Vaikuntha, Vishnu’s own realm, sets off one of the longest arcs in the Puranas. The doorkeepers Jaya and Vijaya turn them away, the Kumaras curse them to be born on earth, and the two return three times as Vishnu’s enemies, first as Hiranyaksha and Hiranyakashipu.</p>`,
  mahar:`<p><i>Mahar</i> means great. When the fire that ends a day of Brahma consumes the three worlds below, its heat reaches up here, and the residents withdraw to Janaloka until the next day begins.</p>`,
  svar:`<p>Svarga is the heaven of Indra, king of the devas, with his city Amaravati, its gardens and its celestial dancers. It is a reward, not a final home: the Bhagavad Gita (9.21) says that when the merit that earned it is spent, the soul returns to the world of mortals.</p>
    <p>At its top shines Dhruva. As a boy of five, slighted by his stepmother, he went into the forest to find Vishnu and meditated until Vishnu appeared to him. His reward was the one fixed point the whole sky turns around.</p>`,
  bhuvar:`<p><i>Bhuvah</i>, the second of the three Vedic worlds, is the open sky between the earth and the sun: the realm of wind and cloud, and the road of siddhas, sages and other celestial travelers. The sun marks its upper edge.</p>`,
  bhu:`<p>Bhu-mandala, the earth disc, is far larger than the world we know. At its center stands Mount Meru, which the Vishnu Purana describes as 84,000 yojanas high and wider at its summit than at its base, like the seed-cup of a lotus.</p>
    <p>Around Meru, rings of land and ocean alternate outward: seven continents, each circled by an ocean of a different liquid, and each continent twice as wide as the one inside it. Past the last ocean lies a land of gold, then the Lokaloka mountains, where the sun’s light stops. Beyond them is darkness, and then the shell of the egg.</p>`,
  bharata:`<p>Bharata, or Bharatavarsha, is the southern region of Jambudvipa, the innermost continent: the land between the ocean and the Himalaya, named for an ancient king called Bharata.</p>
    <p>The Vishnu Purana calls it <i>karma-bhumi</i>, the land of action. In the other regions beings only enjoy or suffer what their past deeds have earned; here, actions bear new fruit. That is why, the text says, even the gods sing the praises of those born here.</p>`,
  atala:`<p><i>Tala</i> means level, and the seven lower worlds are stacked one beneath another. The Bhagavata describes them as full of palaces, gardens and jewels, free of old age and illness, and lit not by the sun but by the gems of the serpents.</p>
    <p>Atala’s ruler, Bala, is a son of the asura architect Maya, and a master of illusion.</p>`,
  vitala:`<p>Here Shiva lives as Hatakeshvara, lord of gold, with his consort Bhavani. The river Hataki that flows through this world gives its name to <i>hataka</i>, the gold the rulers of the lower worlds prize above all else.</p>`,
  sutala:`<p>Bali was the grandson of Prahlada, the devoted boy at the heart of the Narasimha story. Through generosity and strength he won the three worlds from Indra. Vishnu came to him as Vamana, a dwarf, and asked for three steps of land; then he grew to cosmic size and covered earth and heaven in two strides.</p>
    <p>Bali offered his own head for the third. Vishnu rewarded his honesty with this kingdom, richer than heaven, and the promise that Bali would one day be Indra himself (Bhagavata Purana 8.18–8.23).</p>`,
  talatala:`<p>Maya was the great architect of the asuras. He built Tripura, three flying cities of gold, silver and iron, and Shiva destroyed them with a single arrow when they came into line. Even so, the Bhagavata says Shiva protects Maya here. In the Mahabharata, Maya also builds the Pandavas’ great assembly hall.</p>`,
  mahatala:`<p>The serpents here are the sons of Kadru, among them Takshaka and Kaliya. Their fear of Garuda goes back to a wager between Kadru and her sister Vinata, Garuda’s mother, which left Vinata enslaved. Garuda won her freedom by stealing the nectar of immortality from the gods (Mahabharata, book 1).</p>`,
  rasatala:`<p>Rasatala holds the Daityas and Danavas, sons of Diti and Danu, who are half-brothers and old rivals of the devas. The Panis among them are as old as the Rig Veda, where they hide stolen cows that Sarama, Indra’s hound, tracks down.</p>
    <p>The Nivatakavachas return in the Mahabharata, when Arjuna defeats them during his years in Indra’s heaven.</p>`,
  patala:`<p>Patala is also called Nagaloka, the world of the nagas: serpent beings who can take human form. Its lords include Vasuki, who served as the rope when the devas and asuras churned the ocean of milk.</p>
    <p>In the Vishnu Purana, the sage Narada returns from Patala and declares it more beautiful than heaven, bright with the jewels on the serpents’ hoods.</p>`,
  shesha:`<p><i>Ananta</i> means endless, and <i>Shesha</i> means what remains: when the worlds dissolve, the serpent is what is left. He lies below Patala, and in the Bhagavata the whole universe rests on one of his thousand hoods like a mustard seed. The Vishnu Purana adds that when he yawns, the earth shakes.</p>
    <p>Between creations, Vishnu sleeps on his coils on the cosmic ocean. Many traditions also say Shesha came to earth twice: as Lakshmana, Rama’s brother, and as Balarama, Krishna’s.</p>`,
  end:`<p>Time in the Puranas runs in cycles. The four ages, from Satya down to Kali, make one great age of 4.32 million years. A thousand great ages make a single day of Brahma, a <i>kalpa</i>, and his night lasts as long. At nightfall the three worlds dissolve, and at dawn they are made again.</p>
    <p>Brahma lives a hundred years of such days and nights. When his life ends, the whole egg dissolves back into its source, and in time a new one forms.</p>`,
};

// Quotes, word for word, from H. H. Wilson's translation of the Vishnu Purana (1840, public domain).
// Wilson's footnote markers are left out, and his spellings and accents are kept. Worlds the Vishnu Purana
// doesn't describe on their own have no quote: the readable English Bhagavatas are still in copyright.
const VP = n=>`Vishnu Purana ${n} · tr. H. H. Wilson, 1840`;
export const QUOTES = {
  intro:{ text:'The world is encompassed on every side and above and below by the shell of the egg of Brahmá, in the same manner as the seed of the wood-apple is invested by its rind.', cite:VP('2.7') },
  satya:{ text:'…Satya-loka, the sphere of truth, the inhabitants of which never again know death.', cite:VP('2.7') },
  tapa:{ text:'…the Tapo-loka (the sphere of penance), inhabited by the deities called Vaibhrájas, who are unconsumable by fire.', cite:VP('2.7') },
  jana:{ text:'At twice that distance is situated Janaloka, where Sanandana and other pure-minded sons of Brahmá, reside.', cite:VP('2.7') },
  mahar:{ text:'Above Dhruva, at the distance of ten million leagues, lies the sphere of saints, or Mahar-loka, the inhabitants of which dwell in it throughout a Kalpa, or day of Brahmá.', cite:VP('2.7') },
  svar:{ text:'A station shall be assigned to thee, Dhruva, above the three worlds; one in which thou shalt sustain the stars and the planets…', cite:VP('1.12') },
  bhuvar:{ text:'The region that extends from the earth to the sun, in which the Siddhas and other celestial beings move, is the atmospheric sphere…', cite:VP('2.7') },
  bhu:{ text:'Its diameter at the summit is thirty-two thousand Yojanas; and at its base, sixteen thousand: so that this mountain is like the seed-cup of the lotus of the earth.', cite:VP('2.2') },
  bharata:{ text:'The country that lies north of the ocean, and south of the snowy mountains, is called Bhárata, for there dwelt the descendants of Bharata.', cite:VP('2.3') },
  atala:{ text:'They are embellished with magnificent palaces, in which dwell numerous Dánavas, Daityas, Yakshas, and great snake-gods.', cite:VP('2.5') },
  patala:{ text:'The Muni Nárada, after his return from those regions to the skies, declared amongst the celestials that Pátála was much more delightful than Indra’s heaven.', cite:VP('2.5') },
  shesha:{ text:'Śesha bears the entire world, like a diadem, upon his head, and he is the foundation on which the seven Pátálas rest.', cite:VP('2.5') },
  end:{ text:'At the end of this day a dissolution of the universe occurs, when all the three worlds, earth, and the regions of space, are consumed with fire.', cite:VP('1.3') },
};

// Read mode's "At a glance": who lives in each world, and the measurements the texts give (1 yojana ≈ 8–15 km; estimates vary).
// VP = Vishnu Purana, BP = Bhagavata Purana.
export const FACTS = {
  intro:[['Around the egg','Seven envelopes: water, then fire, air, mind, the origin of the elements and intellect, each ten times as broad as the one inside it, and around them boundless nature (VP 2.7)'],
         ['How many eggs','“Thousands and tens of thousands, and millions and thousands of millions” (VP 2.7)']],
  satya:[['Who lives here','Brahma, the creator, and those who will never be born again'],['Height','Twelve crores, 120 million yojanas, above Tapoloka (VP 2.7)']],
  tapa:[['Who lives here','The Vaibhrajas, gods the world-ending fire can’t burn (VP 2.7)'],['Height','Eight crores, 80 million yojanas, above Janaloka (VP 2.7)']],
  jana:[['Who lives here','Sanandana and the other mind-born sons of Brahma (VP 2.7)'],['Height','Two crores, 20 million yojanas, above Maharloka (VP 2.7)']],
  mahar:[['Who lives here','Sages who live through a whole day of Brahma (VP 2.7)'],['Height','One crore, 10 million yojanas, above Dhruva (VP 2.7)'],['Lasting','In between: the three worlds below it are called passing, the three above it lasting (VP 2.7)']],
  svar:[['Who lives here','Indra and the devas; Dhruva at the top'],['Height','From the sun up to Dhruva: about 1.4 million yojanas (VP 2.7)'],['On the way up','The moon, the lunar mansions, Mercury, Venus, Mars, Jupiter, Saturn and the seven sages, each 100,000 to 250,000 yojanas above the last (VP 2.7)']],
  bhuvar:[['Who lives here','Siddhas and other celestial travelers (VP 2.7)'],['Height','From the earth to the sun: 100,000 yojanas (VP 2.7)']],
  bhu:[['Mount Meru','84,000 yojanas high and 16,000 deep; 32,000 across at the summit, 16,000 at the base (VP 2.2)'],
       ['The rings','Seven continents, each twice the size of the one inside it, each ringed by an ocean (VP 2.4)'],
       ['The edge','Past the last ocean, a land of gold where no one lives, then Lokaloka: 10,000 yojanas high and as many broad. Beyond it, darkness, then the shell of the egg (VP 2.4)']],
  bharata:[['Who lives here','The descendants of King Bharata (VP 2.3)'],['Size','9,000 yojanas (VP 2.3)'],['Mountains','Seven main chains: Mahendra, Malaya, Sahya, Shuktimat, Riksha, Vindhya and Paripatra (VP 2.3)']],
  atala:[['Who lives here','Bala, son of the asura architect Maya, master of ninety-six kinds of magic (BP 5.24.16)'],
         ['Depth','Each lower world is 10,000 yojanas deep: 70,000 in all (VP 2.5)'],
         ['The ground','World by world, the soil is white, black, purple, yellow, sandy, stony and gold (VP 2.5)']],
  vitala:[['Who lives here','Shiva as Hatakeshvara, lord of gold, with Bhavani and his attendants (BP 5.24.17)']],
  sutala:[['Who lives here','Bali, son of Virochana and grandson of Prahlada, with Vishnu at his gate (BP 5.24.18)']],
  talatala:[['Who lives here','Maya, master of the asuras’ magic, under Shiva’s protection (BP 5.24.28)']],
  mahatala:[['Who lives here','Kadru’s many-hooded sons, chief among them Kuhaka, Takshaka, Kaliya and Sushena (BP 5.24.29)']],
  rasatala:[['Who lives here','The sons of Diti and Danu: the Panis, the Nivatakavachas, the Kaleyas and the people of Hiranyapura (BP 5.24.30)']],
  patala:[['Who lives here','The nagas, led by Vasuki, with Shankha, Kulika, Mahashankha, Shveta, Dhananjaya, Dhritarashtra, Shankhachuda, Kambala, Ashvatara and Devadatta (BP 5.24.31)'],
          ['Their hoods','Five, seven, ten, a hundred or a thousand each, set with gems that light the dark (BP 5.24.31)']],
  shesha:[['His heads','A thousand, each crested with a jewel that lights all the lower worlds (VP 2.5)'],['When he yawns','The earth, with its woods, mountains, seas and rivers, trembles (VP 2.5)']],
  end:[['The four ages','Satya 4,000, Treta 3,000, Dvapara 2,000 and Kali 1,000 divine years, plus their twilights: 12,000 divine years, each 360 human years (VP 1.3)'],
       ['A day of Brahma','1,000 cycles of the four ages: 4.32 billion years, and a night as long (VP 1.3)']],
};

// Words a newcomer meets on the page. [title, definition, pattern matched in the text]
export const GLOSSARY = {
  purana:['Purana','A genre of Sanskrit texts of cosmology, genealogy and story, compiled over the first millennium CE. There are eighteen major ones.','Puranas?'],
  loka:['Loka','A world, or realm. The Puranas count fourteen inside the egg of Brahma.','lokas?'],
  yojana:['Yojana','The Puranas’ measure of distance. Estimates of its length vary, from about 8 to 15 kilometres.','yojanas?'],
  kalpa:['Kalpa','A day of Brahma: a thousand cycles of the four ages, about 4.32 billion years.','kalpas?'],
  yuga:['Yuga','One of the four ages: Satya (also called Krita), Treta, Dvapara and Kali. Each is shorter and less righteous than the last.','yugas?'],
  deva:['Deva','A god: one of the celestial beings led by Indra.','devas?'],
  asura:['Asura','The rivals of the devas. The Daityas and the Danavas are both asuras.','asuras?'],
  daitya:['Daitya','The sons of Diti: one great family of asuras.','Daityas?'],
  danava:['Danava','The sons of Danu: another great family of asuras.','Danavas?'],
  naga:['Naga','A serpent being, often able to take human form. Many nagas live in the lower worlds.','nagas?'],
  siddha:['Siddha','A perfected being who travels through the sky.','siddhas?'],
  tapas:['Tapas','Austerity, and the inner heat it builds. In the stories it gives sages, and even demons, great power.','tapas'],
  dharma:['Dharma','Right order: duty, virtue and the law that holds the world together.','dharma'],
  meru:['Meru','The golden mountain at the center of the earth disc, wider at its summit than its base.','Meru'],
  vaikuntha:['Vaikuntha','Vishnu’s own realm.','Vaikuntha'],
  brahma:['Brahma','The creator. He lives in Satyaloka, and his days and nights measure the life of the worlds.','Brahma'],
  vishnu:['Vishnu','The preserver, who comes to earth in many forms, among them Narasimha and Vamana.','Vishnu'],
  shiva:['Shiva','One of the three great gods: the great ascetic of Mount Kailasa.','Shiva'],
  indra:['Indra','King of the devas and ruler of Svarga.','Indra'],
  garuda:['Garuda','The great eagle who carries Vishnu, and the sworn enemy of serpents.','Garuda'],
  narada:['Narada','A wandering sage who travels between the worlds, carrying news and songs.','Narada'],
};

// Read mode's further reading, after the glossary
export const READING = [
  ['H. H. Wilson, <i>The Vishnu Purana: A System of Hindu Mythology and Tradition</i> (1840)','The translation quoted on this site, with Wilson’s notes comparing other Puranas. <a href="https://sacred-texts.com/book/the-vishnu-purana" target="_blank" rel="noopener">Read it free</a>.'],
  ['Cornelia Dimmitt and J. A. B. van Buitenen, <i>Classical Hindu Mythology: A Reader in the Sanskrit Puranas</i> (Temple University Press, 1978)','Well-chosen passages from many Puranas, including their cosmology.'],
  ['Wendy Doniger O’Flaherty, <i>Hindu Myths: A Sourcebook Translated from the Sanskrit</i> (Penguin Classics, 1975)','Short, lively translations of the great myths, with notes.'],
  ['G. V. Tagare, <i>The Bhagavata Purana</i> (Motilal Banarsidass, Ancient Indian Tradition and Mythology, 1976–78)','A complete, scholarly English translation of the Bhagavata.'],
  ['Richard L. Thompson, <i>Mysteries of the Sacred Universe: The Cosmology of the Bhagavata Purana</i> (Govardhan Hill, 2000)','A close reading of the Bhagavata’s cosmos, its distances and its maps.'],
  ['Joseph E. Schwartzberg, “Cosmographical Mapping”, in <i>The History of Cartography</i>, vol. 2, book 1 (University of Chicago Press, 1992)','How Hindu, Jain and Buddhist traditions drew the universe, with many illustrations.'],
  ['Willibald Kirfel, <i>Die Kosmographie der Inder</i> (1920)','In German: the classic study that set the Hindu, Jain and Buddhist accounts side by side.'],
];
