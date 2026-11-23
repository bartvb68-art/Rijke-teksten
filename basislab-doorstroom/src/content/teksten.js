// Teksten voor begrijpend lezen, speciaal voor Basislab Doorstroom geschreven.
// level: moeilijkheid van de tekst. Vragen: [vraag, goed antwoord, fout, fout, fout, soort, extra moeilijkheid].
// Soorten: detail, woord, verwijzing, hoofdgedachte, doel, mening, conclusie, alinea, verband.

export const TEKSTEN = [
  {
    id: 'egel', title: 'De egel in de winter', genre: 'informatieve tekst', level: 1.8,
    paras: [
      'Egels zijn kleine zoogdieren met stekels op hun rug. Een volwassen egel heeft wel vijfduizend stekels. Als een egel schrikt, rolt hij zich op tot een bal. Zo kan een vos hem bijna niet pakken.',
      'In de herfst eet een egel heel veel. Hij zoekt naar kevers, regenwormen en slakken. Zo wordt hij dik. Dat is nodig, want in de winter is er bijna geen eten te vinden.',
      'Als het kouder wordt, zoekt de egel een beschut plekje. Dat is bijvoorbeeld een hoop bladeren of een stapel hout. Daar gaat hij in winterslaap. Zijn hart klopt dan veel langzamer en zijn lichaam wordt koud. Zo verbruikt hij weinig energie.',
      'In maart of april wordt de egel weer wakker. Hij is dan veel lichter geworden en heeft grote honger. Wil je egels helpen? Laat in de herfst dan een hoekje van je tuin rommelig met bladeren liggen.',
    ],
    questions: [
      ['Wat doet een egel als hij schrikt?', 'Hij rolt zich op tot een bal.', 'Hij rent heel hard weg.', 'Hij gaat in winterslaap.', 'Hij bijt de vos.', 'detail', -0.6],
      ['Waarom eet een egel in de herfst zo veel?', 'Omdat er in de winter bijna geen eten is.', 'Omdat er in de herfst veel slakken zijn.', 'Omdat hij dan nieuwe stekels krijgt.', 'Omdat hij dan sneller kan rennen.', 'verband', 0],
      ['Wat betekent "beschut" in alinea 3?', 'Beschermd tegen wind en kou.', 'Heel erg donker.', 'Ver weg van mensen.', 'Vol met eten.', 'woord', 0.4],
      ['Welke zin past het best bij de hele tekst?', 'De tekst vertelt hoe een egel de winter doorkomt.', 'De tekst vertelt hoe je een egel als huisdier houdt.', 'De tekst vertelt waarom vossen egels eten.', 'De tekst vertelt hoeveel stekels een egel heeft.', 'hoofdgedachte', 0.4],
      ['Wat kun jij volgens de tekst doen om egels te helpen?', 'Een hoekje van de tuin rommelig laten met bladeren.', 'De egel in de winter eten geven.', 'Een egel mee naar binnen nemen.', 'Alle bladeren uit de tuin opruimen.', 'detail', -0.2],
    ],
  },
  {
    id: 'schoolplein', title: 'Een groen schoolplein', genre: 'nieuwsbericht', level: 2,
    paras: [
      'Basisschool De Klimop in Winsum heeft een nieuw schoolplein. Waar eerst alleen grijze tegels lagen, staan nu bomen, struiken en een moestuin. Ook is er een heuvel met een glijbaan en een beekje waar kinderen met water kunnen spelen.',
      'De leerlingen hebben zelf meegedacht. "We mochten tekeningen maken van ons droomplein," vertelt Yara uit groep 7. "Mijn idee van de wilgenhut is echt gebouwd!"',
      'Volgens de directeur is het nieuwe plein niet alleen leuker, maar ook beter voor de omgeving. Bij hevige regen loopt het water nu de grond in. Vroeger stond het plein dan blank. Ook is het in de zomer koeler onder de bomen.',
      'Op vrijdag 14 oktober wordt het plein officieel geopend door de wethouder. Ouders en buurtbewoners zijn van harte welkom. Na school mogen kinderen uit de buurt er ook spelen.',
    ],
    questions: [
      ['Wat is er volgens de tekst nieuw op het schoolplein?', 'Bomen, een moestuin, een heuvel en een beekje.', 'Nieuwe grijze tegels en een voetbalveld.', 'Een zwembad en een klimrek.', 'Een grote parkeerplaats voor ouders.', 'detail', -0.6],
      ['Waarom staat het citaat van Yara in de tekst?', 'Om te laten zien dat de leerlingen hebben meegedacht.', 'Om uit te leggen hoe een wilgenhut werkt.', 'Om te laten zien dat Yara de beste tekenaar is.', 'Om te vertellen wanneer het plein opent.', 'doel', 0.5],
      ['Wat is een voordeel van het nieuwe plein bij hevige regen?', 'Het water loopt nu de grond in.', 'De kinderen kunnen dan in het beekje spelen.', 'Het plein staat dan blank.', 'Er groeit dan meer in de moestuin.', 'detail', 0],
      ['"Vroeger stond het plein dan blank." Wat betekent "blank" hier?', 'Onder water.', 'Helemaal wit.', 'Helemaal leeg.', 'Erg schoon.', 'woord', 0.5],
      ['Wie mogen er na school op het plein spelen?', 'Ook kinderen uit de buurt.', 'Alleen leerlingen van groep 7 en 8.', 'Alleen de kinderen die tekeningen maakten.', 'Niemand, het plein is dan dicht.', 'detail', -0.4],
    ],
  },
  {
    id: 'pannenkoeken', title: 'Pannenkoeken bakken', genre: 'instructie', level: 1.5,
    paras: [
      'Voor ongeveer 8 pannenkoeken heb je nodig: 250 gram bloem, een snufje zout, 2 eieren, een halve liter melk en een klontje boter.',
      'Stap 1. Doe de bloem en het zout in een kom. Maak in het midden een kuiltje.',
      'Stap 2. Breek de eieren boven het kuiltje. Giet er een scheutje melk bij en roer met een garde tot het een glad beslag is.',
      'Stap 3. Voeg de rest van de melk beetje bij beetje toe. Blijf roeren, zodat er geen klontjes komen.',
      'Stap 4. Smelt een klontje boter in een koekenpan. Schep een flinke soeplepel beslag in de pan en laat het uitlopen. Keer de pannenkoek om als de bovenkant droog is.',
      'Let op: vraag altijd een volwassene om te helpen bij het bakken. De pan wordt erg heet!',
    ],
    questions: [
      ['Hoeveel melk heb je nodig?', 'Een halve liter.', '250 gram.', 'Een scheutje.', 'Een hele liter.', 'detail', -0.5],
      ['Wat doe je meteen nadat je een kuiltje hebt gemaakt?', 'De eieren erin breken.', 'De boter smelten.', 'De rest van de melk erbij doen.', 'De pannenkoek omkeren.', 'detail', 0],
      ['Waarom moet je de melk beetje bij beetje toevoegen?', 'Zodat er geen klontjes komen.', 'Zodat de pannenkoeken dikker worden.', 'Zodat de pan niet te heet wordt.', 'Zodat je minder melk nodig hebt.', 'verband', 0.3],
      ['Wanneer keer je de pannenkoek om?', 'Als de bovenkant droog is.', 'Als de boter gesmolten is.', 'Na precies één minuut.', 'Als het beslag glad is.', 'detail', -0.2],
      ['Wat voor soort tekst is dit?', 'Een tekst die uitlegt hoe je iets moet doen.', 'Een spannend verhaal.', 'Een tekst die je wil overtuigen.', 'Een nieuwsbericht.', 'doel', 0.3],
    ],
  },
  {
    id: 'hond', title: 'Waar is Bobbie?', genre: 'verhaal', level: 2.2,
    paras: [
      'Toen Bas zaterdagochtend de achterdeur opendeed, schoot Bobbie langs zijn benen naar buiten. Het hek stond open. Voordat Bas iets kon roepen, was de kleine hond al om de hoek verdwenen.',
      'Bas rende de straat op. "Bobbie! Bobbie, kom hier!" Maar er kwam geen hond. Zijn buurvrouw, mevrouw Jansen, stond haar ramen te zemen. "Ik zag hem net richting het park rennen," zei ze. "Hij had haast, die kleine."',
      'In het park zocht Bas overal: bij de vijver, achter de bankjes en onder de grote eik. Zijn keel werd dik. Wat als Bobbie de grote weg was overgestoken?',
      'Toen hoorde hij geblaf. Bij de ijskraam stond een groepje kinderen. In het midden zat Bobbie, met zijn staart kwispelend, te wachten op een stukje hoorntje. Bas tilde hem op en drukte hem tegen zich aan. "Jij bent me er eentje," mompelde hij. Vanaf nu zou hij het hek altijd zelf controleren.',
    ],
    questions: [
      ['Hoe kon Bobbie weglopen?', 'Het hek stond open.', 'Bas liet hem los in het park.', 'Mevrouw Jansen liet hem uit.', 'Hij sprong over de schutting.', 'detail', -0.6],
      ['"Zijn keel werd dik." Wat betekent dat?', 'Bas werd verdrietig en bang.', 'Bas kreeg keelpijn.', 'Bas had dorst.', 'Bas moest hard lachen.', 'woord', 0.5],
      ['Wie bedoelt mevrouw Jansen met "die kleine"?', 'Bobbie.', 'Bas.', 'Een kind uit het park.', 'Haar eigen hond.', 'verwijzing', 0],
      ['Waarom was Bobbie bij de ijskraam?', 'Hij hoopte op een stukje hoorntje.', 'Hij was daar vastgebonden.', 'Hij was daar verdwaald en bang.', 'De kinderen hadden hem gevangen.', 'conclusie', 0.4],
      ['Wat neemt Bas zich aan het eind van het verhaal voor?', 'Hij gaat voortaan zelf het hek controleren.', 'Hij gaat Bobbie nooit meer uitlaten.', 'Hij gaat een ijsje kopen voor de kinderen.', 'Hij gaat mevrouw Jansen bedanken.', 'detail', 0],
    ],
  },
  {
    id: 'plasticsoep', title: 'Plasticsoep', genre: 'informatieve tekst', level: 3,
    paras: [
      'Elk jaar komt er miljoenen kilo\'s plastic in zee terecht. Een deel daarvan spoelt aan op stranden, maar het meeste blijft in het water drijven. Op sommige plekken in de oceaan draaien de stromingen rond als een draaikolk. Daar hoopt het plastic zich op. Dit noemen we plasticsoep.',
      'Plastic vergaat niet. Het valt door zon en golven wel uit elkaar in steeds kleinere stukjes, maar het verdwijnt nooit helemaal. Die kleine stukjes heten microplastics. Ze zijn soms zo klein dat je ze niet meer kunt zien.',
      'Voor dieren is plasticsoep gevaarlijk. Zeeschildpadden denken dat een plastic zak een kwal is en eten hem op. Vogels voeren hun jongen met stukjes plastic. Doordat hun maag vol plastic zit, hebben ze geen honger meer en sterven ze van de honger. Bovendien komen microplastics via vissen ook in ons eten terecht.',
      'Gelukkig kun je zelf iets doen. Neem een eigen tas mee naar de winkel, gebruik een drinkfles in plaats van flesjes en gooi afval altijd in de afvalbak. Hoe minder plastic we gebruiken, hoe minder er in zee terechtkomt.',
    ],
    questions: [
      ['Wat is plasticsoep?', 'Plastic dat zich ophoopt op plekken in de oceaan.', 'Soep die in plastic bakjes wordt verkocht.', 'Plastic dat aanspoelt op het strand.', 'Een soort kwal die op plastic lijkt.', 'detail', -0.4],
      ['Wat gebeurt er met plastic in zee?', 'Het valt uit elkaar in kleine stukjes, maar verdwijnt niet.', 'Het lost na een paar jaar helemaal op.', 'Het zinkt meteen naar de bodem.', 'Het wordt door vissen afgebroken.', 'detail', 0],
      ['"Doordat hun maag vol plastic zit, hebben ze geen honger meer." Welk verband geeft "doordat" aan?', 'Oorzaak en gevolg.', 'Een tegenstelling.', 'Een opsomming.', 'Een vergelijking.', 'verband', 0.4],
      ['Waarom is plasticsoep ook voor mensen een probleem?', 'Microplastics komen via vissen in ons eten.', 'Mensen kunnen niet meer zwemmen in zee.', 'Mensen denken dat plastic zakken kwallen zijn.', 'De stranden worden te vol.', 'conclusie', 0.3],
      ['Wat wil de schrijver vooral met de laatste alinea?', 'Lezers aansporen om minder plastic te gebruiken.', 'Uitleggen hoe microplastics ontstaan.', 'Vertellen welke dieren in zee leven.', 'Laten zien hoe groot de oceaan is.', 'doel', 0.5],
    ],
  },
  {
    id: 'fiets', title: 'De geschiedenis van de fiets', genre: 'informatieve tekst', level: 3,
    paras: [
      'In 1817 bedacht de Duitser Karl von Drais een loopmachine. Het was een houten frame met twee wielen, maar zonder trappers. Je zat erop en duwde jezelf vooruit met je voeten. Mensen noemden het een "dandy horse": een paard voor deftige heren.',
      'Rond 1860 kwamen er trappers bij, die direct aan het voorwiel vastzaten. Hoe groter het voorwiel, hoe sneller je ging. Daarom werden de voorwielen steeds groter. Zo ontstond de hoge bi, met een voorwiel van soms anderhalve meter. Opstappen was lastig en vallen was gevaarlijk.',
      'Een grote verbetering was de ketting. Rond 1885 werd de "veiligheidsfiets" gebouwd: twee wielen van gelijke grootte en een ketting die het achterwiel aandreef. Even later kwamen er luchtbanden bij. Daardoor reed de fiets veel comfortabeler.',
      'Tegenwoordig zijn er in Nederland meer fietsen dan inwoners. Veel mensen rijden op een elektrische fiets. Toch werkt die nog steeds volgens hetzelfde idee als de fiets van 1885.',
    ],
    questions: [
      ['Wat ontbrak er aan de loopmachine van Von Drais?', 'Trappers.', 'Wielen.', 'Een zadel.', 'Een frame.', 'detail', -0.5],
      ['Waarom werden de voorwielen rond 1860 steeds groter?', 'Omdat je met een groter voorwiel sneller ging.', 'Omdat opstappen dan makkelijker werd.', 'Omdat je dan minder snel viel.', 'Omdat er dan een ketting op paste.', 'verband', 0.2],
      ['Wat was het belangrijkste verschil tussen de hoge bi en de veiligheidsfiets?', 'De veiligheidsfiets had gelijke wielen en een ketting.', 'De veiligheidsfiets had geen trappers.', 'De hoge bi had luchtbanden.', 'De hoge bi was van hout gemaakt.', 'conclusie', 0.4],
      ['"Daardoor reed de fiets veel comfortabeler." Waar verwijst "daardoor" naar?', 'Naar de luchtbanden.', 'Naar de ketting.', 'Naar het grote voorwiel.', 'Naar de trappers.', 'verwijzing', 0.3],
      ['Welke titel past ook goed bij deze tekst?', 'Van loopmachine tot elektrische fiets.', 'Waarom fietsen gezond is.', 'Het leven van Karl von Drais.', 'Fietsen in de stad is gevaarlijk.', 'hoofdgedachte', 0.4],
    ],
  },
  {
    id: 'zebrapad', title: 'Brief: een zebrapad bij de Lindelaan', genre: 'brief', level: 3.5,
    paras: [
      'Geachte leden van de gemeenteraad,',
      'Wij zijn de leerlingen van groep 8 van basisschool De Regenboog. Wij schrijven u deze brief omdat wij ons zorgen maken over de oversteek bij de Lindelaan.',
      'Elke ochtend steken ongeveer tachtig kinderen daar de weg over. Er rijden veel auto\'s, en sommige rijden veel te hard. Vorige maand werd een leerling van groep 4 bijna aangereden. Gelukkig liep het goed af, maar we schrokken allemaal erg.',
      'Wij hebben een week lang geteld. Tussen half acht en half negen reden er gemiddeld 240 auto\'s langs. Ook hebben we 312 handtekeningen opgehaald van ouders en buurtbewoners die een zebrapad willen.',
      'Daarom vragen wij u om een zebrapad met verkeerslichten aan te leggen bij de Lindelaan. Wij nodigen u graag uit om een ochtend te komen kijken. Dan ziet u zelf hoe druk het is.',
      'Met vriendelijke groet, groep 8 van De Regenboog',
    ],
    questions: [
      ['Waarom schrijft groep 8 deze brief?', 'Omdat ze een veilige oversteek willen bij de Lindelaan.', 'Omdat ze een nieuw schoolplein willen.', 'Omdat een leerling van groep 4 gewond is geraakt.', 'Omdat ze een spreekbeurt over verkeer houden.', 'doel', 0],
      ['Waarom vertellen de leerlingen over het kind uit groep 4?', 'Om te laten zien dat de oversteek gevaarlijk is.', 'Om te vertellen dat het kind een prijs heeft gewonnen.', 'Om de gemeenteraad uit te nodigen.', 'Om te laten zien hoeveel kinderen er op school zitten.', 'doel', 0.4],
      ['Welke twee argumenten gebruiken de leerlingen om hun vraag te steunen?', 'Ze hebben auto\'s geteld en handtekeningen verzameld.', 'Ze hebben een tekening gemaakt en een liedje geschreven.', 'Ze hebben met de politie en de directeur gepraat.', 'Ze hebben een filmpje gemaakt en foto\'s gestuurd.', 'detail', 0.2],
      ['Hoeveel auto\'s reden er gemiddeld langs tussen half acht en half negen?', '240', '80', '312', '24', 'detail', -0.6],
      ['Wat voor soort tekst is dit?', 'Een brief met een verzoek.', 'Een verhaal over een ongeluk.', 'Een krantenbericht over verkeer.', 'Een uitnodiging voor een feest.', 'doel', 0],
    ],
  },
  {
    id: 'dierenverzorger', title: 'Werken in de dierentuin', genre: 'interview', level: 3,
    paras: [
      'Lotte (34) werkt al tien jaar als dierenverzorger bij de olifanten. Wij vroegen haar hoe haar werkdag eruitziet.',
      'Hoe begint je dag? "Om half zeven ben ik er al. Eerst kijk ik hoe het met de dieren gaat. Lopen ze normaal? Eten ze goed? Daarna maak ik de stallen schoon. Een olifant produceert per dag wel honderd kilo mest, dus dat is flink scheppen!"',
      'Wat eten olifanten? "Vooral hooi, takken en groente. Een volwassen olifant eet ongeveer honderdvijftig kilo per dag. We verstoppen het eten ook weleens, zodat de olifanten moeten zoeken. Dat houdt ze scherp en voorkomt verveling."',
      'Wat vind je het mooiste aan je werk? "Dat ik elke olifant echt ken. Ze hebben allemaal hun eigen karakter. Sita is nieuwsgierig, Raja is een echte doerak. Als ik \'s ochtends binnenkom, begroeten ze me met een trompetgeluid."',
      'En het minst leuke? "Als een dier ziek is. Dan maak je je zorgen en blijf je soms tot laat. Maar ik zou geen ander werk willen."',
    ],
    questions: [
      ['Wat doet Lotte als eerste als ze op haar werk komt?', 'Ze kijkt hoe het met de dieren gaat.', 'Ze maakt de stallen schoon.', 'Ze verstopt het eten.', 'Ze geeft de olifanten hooi.', 'detail', -0.4],
      ['Waarom verstoppen de verzorgers soms het eten?', 'Om verveling te voorkomen.', 'Omdat de olifanten anders te veel eten.', 'Omdat de bezoekers dat leuk vinden.', 'Omdat er te weinig eten is.', 'verband', 0],
      ['"Raja is een echte doerak." Wat betekent "doerak" hier?', 'Iemand die graag kattenkwaad uithaalt.', 'Iemand die heel verlegen is.', 'Iemand die heel sterk is.', 'Iemand die vaak ziek is.', 'woord', 0.6],
      ['Wat vindt Lotte het minst leuke aan haar werk?', 'Als een dier ziek is.', 'Het schoonmaken van de stallen.', 'Dat ze zo vroeg moet beginnen.', 'Dat de olifanten zo veel eten.', 'detail', -0.2],
      ['Wat kun je uit het interview concluderen?', 'Lotte houdt veel van haar werk.', 'Lotte wil graag een ander beroep.', 'Lotte vindt olifanten saaie dieren.', 'Lotte werkt nog maar kort in de dierentuin.', 'conclusie', 0.3],
    ],
  },
  {
    id: 'slaap', title: 'Waarom heb je slaap nodig?', genre: 'informatieve tekst', level: 3.6,
    paras: [
      'Kinderen van tien tot twaalf jaar hebben ongeveer negen tot elf uur slaap per nacht nodig. Toch slapen veel kinderen korter. Dat komt vaak door schermen: wie in bed nog op een telefoon kijkt, valt later in slaap.',
      'Tijdens je slaap staat je lichaam niet stil. Je hersenen ruimen op wat je overdag hebt beleefd en geleerd. Wat je \'s middags hebt geoefend, wordt \'s nachts als het ware opgeslagen. Daarom onthoud je dingen beter als je goed hebt geslapen.',
      'Ook je lichaam herstelt zich in de nacht. Spieren groeien, wondjes genezen en je afweer wordt sterker. Kinderen die structureel te weinig slapen, zijn vaker ziek en kunnen zich slechter concentreren.',
      'Het blauwe licht van schermen houdt je hersenen wakker. Het remt de aanmaak van melatonine, een stof die je slaperig maakt. Deskundigen raden daarom aan om een uur voor het slapengaan geen schermen meer te gebruiken. Een boek lezen is een goed alternatief.',
    ],
    questions: [
      ['Hoeveel slaap hebben kinderen van tien tot twaalf jaar ongeveer nodig?', 'Negen tot elf uur per nacht.', 'Zes tot acht uur per nacht.', 'Twaalf uur per nacht.', 'Een uur minder dan volwassenen.', 'detail', -0.6],
      ['Waarom onthoud je dingen beter als je goed hebt geslapen?', 'Je hersenen slaan \'s nachts op wat je hebt geleerd.', 'Je bent dan minder vaak ziek.', 'Je spieren groeien in de nacht.', 'Je hebt dan minder last van blauw licht.', 'verband', 0.2],
      ['Wat betekent "structureel" in alinea 3?', 'Steeds weer, gedurende lange tijd.', 'Af en toe, een enkele keer.', 'Heel erg veel.', 'Zonder dat je het zelf merkt.', 'woord', 0.6],
      ['Wat doet melatonine?', 'Het maakt je slaperig.', 'Het houdt je hersenen wakker.', 'Het geeft blauw licht.', 'Het laat wondjes genezen.', 'detail', 0],
      ['Wat is de belangrijkste boodschap van de tekst?', 'Genoeg slaap is belangrijk voor je hersenen en je lichaam.', 'Telefoons zijn gevaarlijk voor kinderen.', 'Lezen is leuker dan gamen.', 'Volwassenen slapen te weinig.', 'hoofdgedachte', 0.3],
    ],
  },
  {
    id: 'afsluitdijk', title: 'De Afsluitdijk', genre: 'informatieve tekst', level: 4,
    paras: [
      'Op 1 februari 1953 brak in Zeeland en Zuid-Holland de dijk door tijdens een zware storm. Meer dan 1800 mensen kwamen om het leven. Maar ruim twintig jaar eerder had Nederland al een ander groot waterwerk afgerond: de Afsluitdijk.',
      'Vroeger lag in het midden van Nederland de Zuiderzee, een binnenzee die in open verbinding stond met de Noordzee. Bij storm overstroomden de dorpen langs de kust regelmatig. Ingenieur Cornelis Lely bedacht daarom een plan om de Zuiderzee af te sluiten met een dijk van ruim dertig kilometer.',
      'In 1932 was de dijk klaar. De Zuiderzee veranderde in het IJsselmeer. Doordat er geen zout zeewater meer instroomde en rivieren er zoet water in bleven brengen, werd het meer langzaam zoet. Dat had grote gevolgen: zoutwatervissen verdwenen, maar boeren konden het water nu gebruiken voor hun land.',
      'Niet iedereen was blij. Vissers uit dorpen als Volendam en Urk verloren hun vangst van haring en ansjovis. Velen moesten op zoek naar ander werk. Voor het land als geheel woog de veiligheid echter zwaarder.',
      'Tegenwoordig wordt de dijk versterkt, omdat de zeespiegel stijgt en stormen heviger worden. Zo blijft de Afsluitdijk ook in de toekomst het land beschermen.',
    ],
    questions: [
      ['Waarom bedacht Cornelis Lely de Afsluitdijk?', 'Om de dorpen langs de Zuiderzee te beschermen tegen overstromingen.', 'Om de ramp van 1953 te herstellen.', 'Om de vissers van Urk meer vis te laten vangen.', 'Om een snelle weg naar Friesland aan te leggen.', 'verband', 0],
      ['Waarom werd het IJsselmeer langzaam zoet?', 'Er kwam geen zeewater meer in en rivieren brachten zoet water.', 'Het regende er vaker dan vroeger.', 'Boeren pompten er zoet water in.', 'De zoutwatervissen verdwenen.', 'verband', 0.4],
      ['Waarom staat de watersnoodramp van 1953 in de eerste alinea?', 'Om te laten zien hoe gevaarlijk water in Nederland kan zijn.', 'Omdat de Afsluitdijk toen doorbrak.', 'Omdat de Afsluitdijk in 1953 werd gebouwd.', 'Om te vertellen waar Zeeland ligt.', 'doel', 0.6],
      ['"Voor het land als geheel woog de veiligheid echter zwaarder." Wat bedoelt de schrijver?', 'De veiligheid was belangrijker dan de nadelen voor de vissers.', 'De dijk was heel zwaar om te bouwen.', 'De vissers vonden veiligheid niet belangrijk.', 'De dijk was niet veilig genoeg.', 'conclusie', 0.5],
      ['Welke alinea gaat over de nadelen van de Afsluitdijk?', 'Alinea 4.', 'Alinea 2.', 'Alinea 3.', 'Alinea 5.', 'alinea', 0],
    ],
  },
  {
    id: 'vakantie', title: 'Moet de zomervakantie korter?', genre: 'betoog met twee meningen', level: 4,
    paras: [
      'Al jaren is de zomervakantie in Nederland zes weken lang. Sommige mensen vinden dat te lang. Twee leerlingen geven hun mening.',
      'Ahmed (12): "Ik vind dat de zomervakantie korter moet. Na zes weken ben ik bijna alles vergeten wat ik heb geleerd, vooral bij rekenen. De eerste weken na de vakantie zijn we alleen maar aan het herhalen. Als de zomervakantie vier weken duurt en we in het najaar een week extra vrij krijgen, kunnen we beter uitrusten én blijft de stof beter hangen."',
      'Femke (11): "Ik ben het daar niet mee eens. In de zomervakantie leer ik ook, alleen op een andere manier. Ik ga kamperen, help op de boerderij van mijn oom en lees veel boeken. Bovendien kunnen veel ouders alleen in de zomer lang op vakantie. Een kortere vakantie betekent dat gezinnen minder tijd samen hebben."',
      'Onderzoek laat zien dat kinderen in een lange vakantie inderdaad een deel van hun kennis kwijtraken. Maar het verschilt sterk per kind. Kinderen die veel lezen en dingen ondernemen, vergeten minder.',
    ],
    questions: [
      ['Wat is de mening van Ahmed?', 'De zomervakantie moet korter.', 'De zomervakantie moet langer.', 'De zomervakantie moet zes weken blijven.', 'Er moet helemaal geen vakantie zijn.', 'mening', -0.3],
      ['Welk argument geeft Femke?', 'Gezinnen hebben dan minder tijd samen.', 'Je vergeet dan alles wat je hebt geleerd.', 'Je kunt dan beter uitrusten.', 'Je moet dan meer herhalen.', 'mening', 0.2],
      ['"...én blijft de stof beter hangen." Wat bedoelt Ahmed met "de stof"?', 'Wat je op school hebt geleerd.', 'De kleding die je draagt.', 'Het stof in het klaslokaal.', 'De boeken die je leest.', 'woord', 0.4],
      ['Wat zegt het onderzoek in de laatste alinea?', 'Kinderen vergeten in de vakantie iets, maar dat verschilt per kind.', 'Kinderen vergeten in de vakantie niets.', 'Alle kinderen vergeten in de vakantie alles.', 'Kinderen die kamperen, vergeten het meest.', 'conclusie', 0.4],
      ['Waarom heeft de schrijver deze tekst geschreven?', 'Om twee meningen over een onderwerp te laten zien.', 'Om de lezer te overtuigen dat de vakantie korter moet.', 'Om uit te leggen hoe je goed kunt kamperen.', 'Om te vertellen hoe lang de vakanties in andere landen zijn.', 'doel', 0.5],
    ],
  },
  {
    id: 'zolder', title: 'De sleutel van de zolder', genre: 'verhaal', level: 3.5,
    paras: [
      'Al zolang Mira bij haar oma logeerde, was de zolderdeur op slot. "Daar staat alleen oude troep," zei oma altijd. Maar Mira zag hoe oma soms even stil voor de deur bleef staan, alsof ze naar iets luisterde.',
      'Op een regenachtige middag vond Mira in de la van het dressoir een kleine, koperen sleutel. Haar hart bonsde. Ze keek om zich heen. Oma lag te slapen in haar stoel, met haar breiwerk nog op schoot.',
      'Voorzichtig sloop Mira de trap op. De sleutel paste. Met een piepend geluid ging de deur open. Stof dwarrelde in het licht van het kleine raam. Tussen de dozen stond een houten kist met de letters J.v.D. erop.',
      'In de kist lagen brieven, met een lint bij elkaar gebonden, en een foto van een jonge man in uniform. Op de achterkant stond: "Voor Annie. Ik kom terug." Annie, dat was de naam van oma.',
      'Achter zich hoorde Mira een zucht. Oma stond in de deuropening. Ze was niet boos. "Dat was Jan," zei ze zacht. "Hij is nooit teruggekomen." Die avond vertelde oma voor het eerst het hele verhaal.',
    ],
    questions: [
      ['Waarom denkt Mira dat er meer op zolder is dan "oude troep"?', 'Ze ziet oma soms stil voor de zolderdeur staan.', 'Ze hoort geluiden op zolder.', 'Ze vindt een foto in de la.', 'Oma vertelt over een kist.', 'conclusie', 0.3],
      ['"Haar hart bonsde." Hoe voelt Mira zich op dat moment?', 'Gespannen.', 'Verdrietig.', 'Boos.', 'Moe.', 'woord', 0],
      ['Wie is Annie?', 'De oma van Mira.', 'De moeder van Mira.', 'Een vriendin van Jan.', 'Mira zelf.', 'verwijzing', 0],
      ['Wat kun je afleiden over Jan?', 'Hij was vroeger belangrijk voor oma.', 'Hij was de opa van Mira.', 'Hij woonde op de zolder.', 'Hij had de sleutel verstopt.', 'conclusie', 0.5],
      ['Hoe reageert oma als ze Mira op zolder vindt?', 'Ze is niet boos en vertelt later het verhaal.', 'Ze is heel boos en stuurt Mira naar bed.', 'Ze pakt de sleutel af en doet de deur op slot.', 'Ze begint hard te huilen en loopt weg.', 'detail', -0.3],
    ],
  },
  {
    id: 'bijen', title: 'Bijen in gevaar', genre: 'informatieve tekst', level: 4.2,
    paras: [
      'Zonder bijen zouden onze supermarkten er heel anders uitzien. Ongeveer driekwart van de voedselgewassen die wij eten, is voor een deel afhankelijk van bestuiving door insecten. Denk aan appels, aardbeien, komkommers en koffie.',
      'Bij bestuiving brengt een insect stuifmeel van de ene bloem naar de andere. Pas dan kan een bloem vrucht of zaad vormen. Honingbijen zijn hierbij bekend, maar wilde bijen, hommels en zweefvliegen doen minstens zoveel werk. In Nederland leven ruim 350 soorten wilde bijen.',
      'Het gaat echter niet goed met de bijen. Meer dan de helft van de wilde bijensoorten in Nederland staat op de Rode Lijst: ze zijn bedreigd of zelfs al verdwenen. Er zijn verschillende oorzaken. Er zijn minder bloemrijke bermen en weilanden, er worden bestrijdingsmiddelen gebruikt en het klimaat verandert.',
      'Iedereen kan bijen helpen. Een tuin met verschillende bloemen die op verschillende momenten in het jaar bloeien, biedt voedsel van het vroege voorjaar tot de late herfst. Een bijenhotel geeft wilde bijen een plek om eitjes te leggen. Ook gemeenten doen mee: steeds vaker worden bermen minder vaak gemaaid, zodat er meer bloemen groeien.',
    ],
    questions: [
      ['Waarom zijn bijen belangrijk voor ons voedsel?', 'Veel gewassen hebben bestuiving door insecten nodig.', 'Bijen maken alle honing die we eten.', 'Bijen beschermen planten tegen ziektes.', 'Bijen eten insecten die gewassen opeten.', 'hoofdgedachte', 0],
      ['Wat is bestuiving?', 'Stuifmeel van de ene naar de andere bloem brengen.', 'Honing maken van nectar.', 'Een bijenhotel bouwen.', 'Bermen minder vaak maaien.', 'detail', -0.3],
      ['Wat betekent het als een soort op de Rode Lijst staat?', 'De soort is bedreigd of verdwenen.', 'De soort is heel gevaarlijk.', 'De soort heeft een rode kleur.', 'De soort maakt veel honing.', 'woord', 0.2],
      ['Welke oorzaak voor de achteruitgang van bijen noemt de tekst NIET?', 'Er worden te veel bijenhotels gebouwd.', 'Er zijn minder bloemrijke bermen.', 'Er worden bestrijdingsmiddelen gebruikt.', 'Het klimaat verandert.', 'detail', 0.5],
      ['Waarom is het goed om bloemen te hebben die op verschillende momenten bloeien?', 'Dan is er het hele seizoen voedsel voor bijen.', 'Dan heb je minder onkruid in de tuin.', 'Dan hoeven bijen geen eitjes meer te leggen.', 'Dan komen er geen zweefvliegen meer.', 'verband', 0.4],
    ],
  },
  {
    id: 'gamen', title: 'Is gamen slecht voor je?', genre: 'beschouwing', level: 4.6,
    paras: [
      'Bijna negen op de tien kinderen in groep 8 gamen weleens. Volwassenen maken zich daar vaak zorgen over. Ze denken dat gamen slecht is voor je concentratie of dat je er agressief van wordt. Maar klopt dat eigenlijk wel?',
      'Wetenschappers hebben er veel onderzoek naar gedaan, en de uitkomsten zijn genuanceerd. Sommige games blijken juist vaardigheden te trainen. Wie strategiespellen speelt, moet vooruitdenken en plannen. Bij actiespellen moet je snel reageren en op veel dingen tegelijk letten. Ook samenwerken en Engels leren gaat bij online spellen vaak vanzelf.',
      'Toch zijn er ook risico\'s. Het grootste probleem is niet het gamen zelf, maar de tijd die eraan opgaat. Wie urenlang achter een scherm zit, beweegt weinig, slaapt soms slecht en heeft minder tijd voor vrienden, huiswerk of buiten spelen. Daarnaast zijn sommige spellen zo ontworpen dat je moeilijk kunt stoppen, bijvoorbeeld door beloningen die je alleen krijgt als je elke dag inlogt.',
      'Het antwoord op de vraag of gamen slecht is, is dus: dat hangt ervan af. Het gaat erom wát je speelt, hoe lang en of je daarnaast nog genoeg andere dingen doet. Experts adviseren om vaste afspraken te maken over speeltijd, en om af en toe samen met je ouders te gamen.',
    ],
    questions: [
      ['Wat betekent "genuanceerd" in alinea 2?', 'Niet simpelweg goed of slecht, maar met verschillende kanten.', 'Heel duidelijk en eenvoudig.', 'Helemaal negatief.', 'Nog niet bekend.', 'woord', 0.4],
      ['Welke vaardigheid kun je volgens de tekst oefenen met strategiespellen?', 'Vooruitdenken en plannen.', 'Snel reageren.', 'Engels spreken.', 'Beter slapen.', 'detail', -0.4],
      ['Wat is volgens de schrijver het grootste probleem van gamen?', 'De tijd die eraan opgaat.', 'Dat je er agressief van wordt.', 'Dat je er slechter Engels van leert.', 'Dat games te duur zijn.', 'detail', 0],
      ['Waarom noemt de schrijver beloningen voor elke dag inloggen?', 'Als voorbeeld van een manier waarop spellen je laten doorspelen.', 'Als tip om meer beloningen te verdienen.', 'Om te laten zien dat gamen gezond is.', 'Om uit te leggen hoe je een spel wint.', 'doel', 0.5],
      ['Wat is de conclusie van de tekst?', 'Of gamen slecht is, hangt af van wat je speelt en hoe lang.', 'Gamen is altijd slecht voor kinderen.', 'Gamen is altijd goed voor je concentratie.', 'Kinderen moeten stoppen met gamen.', 'hoofdgedachte', 0.3],
    ],
  },
  {
    id: 'trekvogels', title: 'Het raadsel van de trekvogels', genre: 'informatieve tekst', level: 4.8,
    paras: [
      'Elk najaar vertrekken miljoenen vogels uit Nederland naar het zuiden. De boerenzwaluw vliegt bijvoorbeeld helemaal naar zuidelijk Afrika: een reis van meer dan tienduizend kilometer. In het voorjaar komt hij terug, vaak naar precies dezelfde schuur als het jaar ervoor. Hoe vinden deze vogels hun weg?',
      'Lange tijd was dat een raadsel. Inmiddels weten onderzoekers dat vogels meerdere "kompassen" tegelijk gebruiken. Overdag oriënteren ze zich op de stand van de zon. \'s Nachts gebruiken veel soorten de sterren. Jonge vogels leren de sterrenhemel kennen door in hun eerste zomer te kijken rond welk punt de sterren draaien: dat punt ligt in het noorden.',
      'Daarnaast kunnen vogels het magnetisch veld van de aarde waarnemen. Hoe dat precies werkt, is nog niet helemaal duidelijk. Een theorie is dat er in het oog van vogels een stof zit die reageert op magnetisme. Een vogel zou het magnetisch veld dan als het ware kunnen zien.',
      'Dichter bij huis herkennen vogels landschappen, kustlijnen en rivieren. Sommige soorten gebruiken zelfs geuren om de laatste kilometers te vinden. Juist die combinatie van hulpmiddelen maakt dat vogels zo zelden verdwalen. Valt het ene "kompas" weg, bijvoorbeeld bij bewolking, dan nemen de andere het over.',
    ],
    questions: [
      ['Wat is het onderwerp van deze tekst?', 'Hoe trekvogels hun weg vinden.', 'Waarom vogels in de winter naar het zuiden gaan.', 'Hoe de boerenzwaluw zijn nest bouwt.', 'Hoe een kompas werkt.', 'hoofdgedachte', -0.2],
      ['Hoe leren jonge vogels waar het noorden is?', 'Door te kijken rond welk punt de sterren draaien.', 'Door de zon te volgen.', 'Door hun ouders na te vliegen.', 'Door aan de rivieren te ruiken.', 'detail', 0.2],
      ['"Een vogel zou het magnetisch veld dan als het ware kunnen zien." Waarom gebruikt de schrijver "zou"?', 'Omdat het een theorie is die nog niet bewezen is.', 'Omdat vogels dat in de toekomst gaan kunnen.', 'Omdat vogels dat vroeger konden.', 'Omdat het een grapje is.', 'conclusie', 0.6],
      ['Waarom verdwalen vogels zo zelden?', 'Ze gebruiken een combinatie van hulpmiddelen.', 'Ze vliegen altijd in grote groepen.', 'Ze vliegen alleen bij mooi weer.', 'Ze hebben een ingebouwde kaart van de wereld.', 'verband', 0.3],
      ['Welke alinea gaat over hulpmiddelen die vogels gebruiken als ze bijna op hun bestemming zijn?', 'Alinea 4.', 'Alinea 1.', 'Alinea 2.', 'Alinea 3.', 'alinea', 0.3],
    ],
  },
  {
    id: 'moestuin', title: 'Onze klassenmoestuin', genre: 'verslag', level: 2.6,
    paras: [
      'In maart zijn we met groep 8 begonnen aan een moestuin achter de school. Eerst moesten we de grond omspitten. Dat was zwaar werk, want de grond was hard en zat vol stenen.',
      'Daarna hebben we zaadjes geplant: worteltjes, radijsjes, sla en bonen. Iedere week was een ander groepje verantwoordelijk voor het water geven. Op een warme week in april vergat een groepje het een paar dagen. De sla was toen helemaal verlept.',
      'De radijsjes waren het eerst klaar, al na vier weken. Ze waren pittig van smaak. Niet iedereen vond ze lekker, maar Sem at er wel tien op.',
      'In juni hebben we alles geoogst. Van de bonen en worteltjes hebben we samen soep gemaakt. Die hebben we opgegeten met de kinderen van groep 3, die ons hadden geholpen met wieden. Het was een geslaagde afsluiting!',
    ],
    questions: [
      ['Waarom was het omspitten zwaar werk?', 'De grond was hard en zat vol stenen.', 'Het was erg warm in maart.', 'Er waren te weinig schoppen.', 'Groep 3 hielp niet mee.', 'detail', -0.4],
      ['Wat gebeurde er met de sla?', 'Die verlepte omdat hij geen water kreeg.', 'Die werd opgegeten door slakken.', 'Die was het eerst klaar.', 'Die werd gebruikt voor de soep.', 'detail', 0],
      ['"Niet iedereen vond ze lekker." Waar verwijst "ze" naar?', 'De radijsjes.', 'De worteltjes.', 'De kinderen van groep 3.', 'De bonen.', 'verwijzing', 0],
      ['Waarom aten de kinderen de soep samen met groep 3?', 'Groep 3 had geholpen met wieden.', 'Groep 3 had de soep gekookt.', 'Groep 3 had de zaadjes gekocht.', 'Groep 3 had de radijsjes opgegeten.', 'verband', 0.2],
      ['Wat voor tekst is dit?', 'Een verslag van wat de klas heeft gedaan.', 'Een recept voor groentesoep.', 'Een uitleg over hoe je moet tuinieren.', 'Een spannend verhaal.', 'doel', 0.3],
    ],
  },
  {
    id: 'zwerfafval', title: 'Statiegeld op blikjes', genre: 'nieuwsbericht', level: 3.8,
    paras: [
      'Sinds 31 december 2022 betaal je in Nederland statiegeld op blikjes. Wie een blikje frisdrank koopt, betaalt vijftien cent extra. Dat geld krijg je terug als je het lege blikje inlevert bij de supermarkt.',
      'De maatregel moet zwerfafval verminderen. Voor de invoering waren blikjes een van de meest gevonden soorten afval in de natuur. Vooral langs fietspaden en in bermen lagen er veel. Dieren kunnen zich verwonden aan de scherpe randen, en koeien kunnen stukjes binnenkrijgen via het gras.',
      'Uit tellingen van vrijwilligers blijkt dat er een jaar later inderdaad minder blikjes in de natuur liggen. Toch is het probleem nog niet opgelost. Niet alle blikjes worden ingeleverd, en sommige mensen vinden het inleveren te veel moeite.',
      'Er zijn ook kinderen die er een sport van maken. Zij rapen weggegooide blikjes op en leveren ze in. "Zo verdien ik zakgeld en help ik de natuur," zegt Liam (11). "Vorige maand had ik al acht euro bij elkaar."',
    ],
    questions: [
      ['Hoeveel statiegeld betaal je op een blikje?', 'Vijftien cent.', 'Acht euro.', 'Vijf cent.', 'Vijfentwintig cent.', 'detail', -0.6],
      ['Wat is het doel van statiegeld op blikjes?', 'Minder zwerfafval in de natuur.', 'Meer geld voor de supermarkt.', 'Frisdrank duurder maken zodat kinderen minder drinken.', 'Koeien meer gras laten eten.', 'doel', 0],
      ['Waarom zijn blikjes gevaarlijk voor koeien?', 'Ze kunnen stukjes binnenkrijgen via het gras.', 'Ze kunnen erover struikelen.', 'Ze drinken de frisdrank op.', 'Ze worden bang van het geluid.', 'detail', 0],
      ['Liam heeft vorige maand acht euro verdiend. Hoeveel blikjes heeft hij ongeveer ingeleverd?', 'Ongeveer 53.', 'Ongeveer 8.', 'Ongeveer 15.', 'Ongeveer 120.', 'conclusie', 0.8],
      ['Welke conclusie past bij de derde alinea?', 'Statiegeld helpt, maar lost het probleem niet helemaal op.', 'Statiegeld heeft helemaal niet geholpen.', 'Er liggen helemaal geen blikjes meer in de natuur.', 'Vrijwilligers rapen alle blikjes op.', 'conclusie', 0.4],
    ],
  },
];
