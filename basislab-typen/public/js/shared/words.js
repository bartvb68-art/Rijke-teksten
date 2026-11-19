// Nederlandse woorden, zinnen en teksten voor Basislab Typen.
// Alleen letters a-z (geen accenten of apostroffen), zodat elk woord met een
// standaard toetsenbord zonder dode toetsen te typen is.

const RAW_WORDS = `
al als das dak dag dal gas glas haas hak hal hals half jas kaal kaas las lak laag
sla lag haal gaas jaag sjaal slak slag gaf
de die dief dik dij dijk ei eis eik eik eiland elf fee feest geel heel deel keel kies
lief les ijs kijk lijf gek heks gids geld held hek hel hield hij jij ik is
gil glad gelijk kei ledig leef leeg legde lei   lid lied sik slee
fiks fles   kiel kijkje slijk
de deze dikke dag sfeer egel gegil hekje idee ideaal jaag jagen
rijk rij rijs reis reus rug ruis rijst rijk riem raar raak rare rek rijdt
kaart kers kurk rus rauw uil ui uur   duur dier duik   fris frisse
gras gul hard heer huis juk kar kus lauw raad rad ruik rups ruiker ruil
sluis sluier struik suiker gauw geur graaf graag grijs groef grijze
draak druif druk drie dril drijf
tent tien tand taart test tas tak tal tegel tijger tijd tuin trein tafel taak
nat net nee nest niet nieuw nu nul nek noot neus nier nacht nagel naald
en een ene een eend eten etend tante tanden tenten tegen tussen
anker antenne arend arena atlas aster ster sterk sterren stenen staart stad
stal stand stank stil stuk tuit turen tunnel uitje uiteen uiterst rest rust
dertien drinken drukte duinen duister eiland erger erin ernstig fietst fiets
fruit geit gieter gitaar glans glijden grens grind grenzen haar handig hart hert
huilen jaar jager jarig juist kat kist klant klein kleine klinker knie
knikker kraan kring kruid kruis laat lang lange later leest leeuw lente letter
lijn lijst links lint luid luiken naar nest niets nergens nieuwe nijlpaard
rennen ridder ring rijden ruiter ruit saai sinas slang slank slingeren sneeuw
snel snelle snijden spin staan stad stijl strand straat stuur suikerspin
taart tante tellen tennis tijger tikken tinten treinen trillen trui tuinier
uitleg werk wolk wolf water weer wieg wiel wind winter wit wortel woord woorden
oog oor oud oude ooit oven oren otter oogst olie orde over open oranje
o op of om ons onder ook oom
wat wie waar wandel wagen waren weten wereld west wiel wijs wijn worst wol
woensdag wonder worden wolken
vis vos vuur vier vijf vlag vlieg vlinder vogel voet voeten vrij vriend vrolijk
vandaag vader van vast veel ver verder vergeet verhaal verjaardag vies vinger
maan maand markt melk mens mes meter middag moe moeder mooi muis muur muziek
mand mama mag maken man meer mee met mijn min minder molen mond morgen mos
merel meeuw meneer mus maandag mier
paard pad pan papier park pen peer pijl pil plant plas plein plek pet pop
post praat prijs punt puzzel pinda poes poort pomp
boom boot bos boek bal bed beer beker bel berg bij bijl bloem blauw blij blok
boer boter brief brood broek brug bus buik buur bank band baan beter blad
bord bus begin buiten boven bewegen
cent cijfer circus citroen clown code computer cactus camera
zon zee zak zand zout zus zeven zes zien zingen zitten zomer zwart zwaan zwemmen
zebra zolder zuster zaterdag zondag zaal zeep zak zorg zwaar
yoga yoyo quiz taxi examen extra fax
ik jij hij zij wij jullie zij het een de
appel avond arm auto baby been beest bezoek blijven bloemen boekje boerderij
dansen deur dinosaurus dokter dolfijn doos dorp drinken duif dwerg ezel familie
feest fietsen film fluit gans geluk gezin giraf goud groen groot haai hamster
hand hond honing hoed hut ijsje ijsbeer insect jongen jurk kaars kabouter
kampvuur kanaal kasteel keuken kikker kind kip klok knop koe koekje koning
konijn kop kort kunst kwal laars lamp leeuw leraar lepel lezen licht liedje
luchtballon maandag meisje meneer mier mobiel monster muts nacht neef nicht
olifant ontbijt oom opa oma pad pannenkoek papegaai parel piraat plant
pompoen potlood prins prinses raket regen regenboog robot roos rots sap school
schaap schaar schip schoen schrijven slak slapen sloot sneeuwpop soep sok speel
spel spelen spiegel spook sport springen stoel storm stroop tafel tekening
telefoon thee tijger toren trap trommel tuin uil vlinder vork vriendin vrucht
walvis wolf zebra zeehond zwembad astronaut planeet komeet meteoor ruimte
sterrenstelsel heelal lancering satelliet maanlander typen toets toetsen
vinger vingers duim letter woord zin snel netjes rustig goed knap super
`;

// Zinnen met hoofdletters en leestekens (vanaf de hoofdletterlessen).
export const SENTENCES = [
  'De raket staat klaar voor de lancering.',
  'Mijn kat slaapt graag op de warme bank.',
  'We gaan vandaag naar het strand.',
  'Kijk eens hoe snel die vogel vliegt!',
  'Heb jij je huiswerk al gemaakt?',
  'Opa en oma komen morgen op bezoek.',
  'In de winter valt er soms sneeuw.',
  'De astronaut zwaait naar de aarde.',
  'Wat eten we vanavond?',
  'Sara heeft een nieuwe fiets gekregen.',
  'Het is fijn om buiten te spelen.',
  'De juf leest een spannend verhaal voor.',
  'Pas op, de vloer is glad!',
  'Tom en Lisa bouwen een hut in het bos.',
  'Waar is mijn andere sok gebleven?',
  'De maan draait om de aarde.',
  'Een komeet heeft een lange staart van ijs en stof.',
  'Mijn hond rent achter de bal aan.',
  'Wie wil er een stuk taart?',
  'Ik typ met tien vingers, zonder te kijken!',
  'De zon is een ster, net als alle andere sterren.',
  'Op Mars is de bodem rood van kleur.',
  'Morgen hebben we gym in de grote zaal.',
  'Noah speelt gitaar en Emma speelt piano.',
  'Ruim je kamer op, zei mama.',
  'Let op: de bus vertrekt om negen uur.',
  'Ben jij ook zo dol op pannenkoeken?',
  'Een walvis is het grootste dier van de zee.',
  'Wat een mooie regenboog!',
  'De trein naar Utrecht heeft vertraging.',
  'Bij de bakker kopen we vers brood.',
  'Het team juicht: we hebben gewonnen!',
  'Kun jij een raket tekenen?',
  'De bibliotheek is open op woensdag.',
  'Jupiter is de grootste planeet van ons zonnestelsel.',
  'Fleur en Daan maken samen een werkstuk.',
  'Vergeet je jas niet, het gaat regenen.',
  'Mijn broertje is bang in het donker.',
  'Typen gaat steeds beter als je elke dag oefent.',
  'Hoe heet de hoofdstad van Frankrijk?',
];

// Zinnen met cijfers.
export const NUMBER_SENTENCES = [
  'Ik heb 3 katten en 2 honden.',
  'De bus komt om 4 uur.',
  'In de klas zitten 25 kinderen.',
  'Er staan 12 bomen in het park.',
  'Mijn zus is 5 jaar oud.',
  'We lopen 3 rondjes om het veld.',
  'De raket gaat over 10 seconden de lucht in.',
  'Een week heeft 7 dagen.',
  'Een jaar heeft 12 maanden en 365 dagen.',
  'Ik kreeg een 8 voor mijn toets!',
  'Bladzijde 42 is het mooiste plaatje.',
  'Om 9 uur begint de school.',
  'Er zijn 8 planeten in ons zonnestelsel.',
  'De voetbalwedstrijd eindigde in 3 tegen 1.',
  'Wij wonen op nummer 15.',
  'Het zwembad is 25 meter lang.',
  'Ik heb 14 knikkers en mijn vriend heeft er 21.',
  'In 1969 liep de eerste mens op de maan.',
  'De taart kost 6 euro en het brood 3 euro.',
  'De klas telt van 1 tot 50.',
  'Er passen 4 kinderen in de auto.',
  'We hebben 2 weken vakantie.',
  'Groep 8 gaat 3 dagen op kamp.',
  'Ik slaap meestal 10 uur per nacht.',
];

// Langere teksten voor de lessen met teksten en het typediploma.
export const TEXTS = [
  'Ver weg in het heelal zweeft een kleine planeet. Er wonen geen mensen, maar wel rare wezens met drie ogen. Ze eten sterrenstof en drinken maanwater. Elke avond kijken ze naar de aarde en zwaaien ze naar ons. Zwaai jij vanavond terug?',
  'Een olifant is het grootste dier dat op het land leeft. Hij gebruikt zijn slurf om te drinken, te eten en om zich te wassen. Olifanten leven in groepen. De oudste vrouw is de baas van de groep. Ze weet waar water te vinden is.',
  'Vandaag is het sportdag. Alle kinderen dragen een shirt met de kleur van hun team. Er is touwtrekken, zaklopen en estafette. Het blauwe team wint de eerste ronde, maar het rode team haalt in. Aan het einde krijgt iedereen een ijsje.',
  'Lisa wil later astronaut worden. Ze leest alle boeken over de ruimte die ze kan vinden. Ze weet hoe ver de maan is en waarom Mars rood is. Haar droom is om ooit zelf door een raampje naar de aarde te kijken.',
  'Wist je dat bijen kunnen dansen? Als een bij een veld vol bloemen heeft gevonden, vliegt ze terug naar de korf. Daar maakt ze een speciale dans. Zo vertelt ze de andere bijen precies waar de bloemen staan.',
  'In de herfst vallen de bladeren van de bomen. Ze worden geel, oranje en rood. Eekhoorns verzamelen nootjes voor de winter en verstoppen ze in de grond. Soms vergeten ze waar ze hun nootjes hebben verstopt. Dan groeit er een nieuwe boom.',
  'Een computer doet precies wat je zegt. Daarom moet je goed nadenken over wat je typt. Wie snel en netjes kan typen, maakt minder fouten en houdt meer tijd over. Met tien vingers typen is dus heel handig, op school en thuis.',
  'Het regent al de hele dag. Daan en Noor bouwen binnen een hut van dekens en kussens. Met een zaklamp lezen ze een spannend boek over piraten. Opeens hoor je de bel. Oma komt binnen met warme chocolademelk!',
];

export const WORDS = [...new Set(
  RAW_WORDS.split(/\s+/).map((w) => w.trim().toLowerCase()).filter((w) => /^[a-z]+$/.test(w)),
)];
