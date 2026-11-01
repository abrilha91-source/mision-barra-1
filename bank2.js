// Ampliación del banco: conjuntos generados de forma fija (siempre los mismos).
(function () {
  const V = [['write','wrote','written','the report'],['buy','bought','bought','new boots'],['take','took','taken','the medicine'],['give','gave','given','the orders'],['bring','brought','brought','the supplies'],['send','sent','sent','the message'],['read','read','read','the manual'],['find','found','found','the keys'],['leave','left','left','the base'],['see','saw','seen','the doctor'],['eat','ate','eaten','breakfast'],['drink','drank','drunk','the water'],['drive','drove','driven','the truck'],['speak','spoke','spoken','English'],['break','broke','broken','the radio'],['forget','forgot','forgotten','the password'],['choose','chose','chosen','a partner'],['wear','wore','worn','the uniform'],['teach','taught','taught','the class'],['catch','caught','caught','the bus'],['build','built','built','a shelter'],['sell','sold','sold','the old car'],['tell','told','told','the truth'],['pay','paid','paid','the bill'],['lose','lost','lost','the map'],['hold','held','held','the meeting'],['keep','kept','kept','the records'],['make','made','made','a mistake'],['meet','met','met','the colonel'],['ride','rode','ridden','a horse'],['sing','sang','sung','the anthem'],['steal','stole','stolen','the money'],['throw','threw','thrown','the ball'],['understand','understood','understood','the lesson'],['win','won','won','the competition'],['begin','began','begun','the exercise'],['draw','drew','drawn','a map'],['fly','flew','flown','the helicopter'],['hide','hid','hidden','the documents'],['shake','shook','shaken','the bottle'],['feed','fed','fed','the patients'],['lend','lent','lent','some money'],['spend','spent','spent','the weekend'],['sweep','swept','swept','the floor'],['sew','sewed','sewn','the button'],['grow','grew','grown','vegetables'],['know','knew','known','the answer'],['do','did','done','the homework'],['get','got','gotten','a letter'],['hear','heard','heard','the alarm']];
  const L = [];
  const ing = v => v.endsWith('e') && v !== 'see' ? v.slice(0, -1) + 'ing' : v + 'ing';
  const S3 = v => /(s|sh|ch|o)$/.test(v) ? v + 'es' : v.endsWith('y') ? v.slice(0, -1) + 'ies' : v + 's';
  const uniq = a => [...new Set(a)];
  V.forEach(([b, p, pp, o]) => {
    const d1 = uniq([b, ing(b), pp === p ? S3(b) : pp, 'was ' + ing(b), 'is ' + b].filter(x => x !== p)).slice(0, 3);
    L.push(`tie||Yesterday the cadet ___ ${o}.|${p}|${d1.join('|')}`);
    const d2 = uniq([b, ing(b), pp === p ? S3(b) : p, 'to ' + b].filter(x => x !== pp)).slice(0, 3);
    L.push(`tie||She has already ___ ${o}.|${pp}|${d2.join('|')}`);
    L.push(`tie||Every Monday he ___ ${o}.|${S3(b)}|${uniq([b, ing(b), p, pp, 'is ' + b].filter(x => x !== S3(b))).slice(0, 3).join('|')}`);
  });
  const SYN = [['begin','start'],['finish','complete'],['quick','fast'],['big','large'],['small','little'],['afraid','scared'],['happy','glad'],['ill','sick'],['shut','close'],['speak','talk'],['buy','purchase'],['enough','sufficient'],['need','require'],['help','aid'],['correct','right'],['choose','select'],['show','demonstrate'],['try','attempt'],['ask','inquire'],['answer','reply'],['look for','search'],['allow','permit'],['hurry','rush'],['wealthy','rich'],['strange','odd'],['simple','easy'],['ancient','very old'],['brave','courageous'],['damage','harm'],['tired','fatigued'],['injury','wound'],['meal','food'],['journey','trip'],['remain','stay'],['assist','help'],['inspect','examine'],['locate','find'],['obtain','get'],['notify','inform'],['commence','begin'],['terminate','end'],['vehicle','car or truck'],['enemy','opponent'],['weapon','arm'],['shelter','protection'],['supply','provide'],['remove','take away'],['reduce','make smaller'],['expand','make larger'],['frequent','common'],['rare','unusual'],['accurate','exact'],['purpose','reason'],['route','way'],['instructor','teacher'],['injure','hurt'],['permit','allow'],['quarrel','argument'],['reply','answer'],['fatal','deadly'],['huge','enormous'],['silent','quiet'],['nearby','close'],['previous','earlier'],['chief','main'],['tidy','neat'],['soaked','very wet'],['skilled','expert'],['ache','pain'],['vital','essential']];
  SYN.forEach(([w, s], i) => { const d = [1, 7, 19].map(k => SYN[(i + k) % SYN.length][1]); L.push(`voc||${w.toUpperCase()} means ___.|${s}|${d.join('|')}`); });
  L.push(...`P|The military hospital opened a new vaccination area on Monday. It is on the ground floor, next to the pharmacy, and is open from 0800 to 1400. Staff must bring their vaccination card; without it, the vaccine will not be applied.
lec||Where is the vaccination area?|next to the pharmacy|on the top floor|in the emergency room|outside the hospital
lec||When does it close?|at 1400|at 0800|at noon|at 2000
lec||What must staff bring?|their vaccination card|their uniform|a doctor's note|money
P|Corporal Vega failed his first English exam with 38 points. He began practicing ten minutes every day, mostly listening. Three months later he scored 55. His instructor says daily practice was more useful than long study sessions before the exam.
lec||What was his first score?|38|55|10|60
lec||What did he practice most?|listening|grammar|vocabulary|writing
lec||According to the instructor, what helped most?|daily practice|long sessions before the exam|private classes|reading books
P|To prevent falls, patients over seventy must have the bed rails up at night. Nurses check them every two hours and record it on the chart. If a patient falls, the nurse informs the doctor immediately and writes an incident report.
lec||Who must have the bed rails up?|patients over seventy|all visitors|nurses|children only
lec||How often are the rails checked?|every two hours|once a night|every hour|twice a day
lec||What happens after a fall?|the doctor is informed and a report is written|nothing|the patient goes home|the rails are removed
P|The cadets will travel to Puebla for a field exercise. The bus departs Friday at 0500 and returns Sunday at 1800. Each cadet carries water, a first aid kit and a sleeping bag. Cell phones may be used only during rest periods.
lec||When does the bus return?|Sunday at 1800|Friday at 0500|Saturday at noon|Monday morning
lec||What do cadets NOT need to carry, according to the text?|a tent|water|a first aid kit|a sleeping bag
lec||When can cell phones be used?|only during rest periods|at any time|never|only on the bus
P|Blood pressure should be measured with the patient seated and relaxed for five minutes. The arm must be at heart level. Talking during the measurement can increase the result, so the patient should remain silent.
lec||How long should the patient rest first?|five minutes|one minute|ten seconds|an hour
lec||Where must the arm be?|at heart level|above the head|behind the back|on the floor
lec||Why should the patient stay silent?|talking can raise the result|it is a rule of courtesy|the nurse is busy|to save time
P|Last year the school library received 300 new books, most of them about nursing and pharmacology. Cadets can borrow up to three books for two weeks. Books can be renewed once if no one else has requested them.
lec||How many new books arrived?|300|three|two|thirty
lec||How long can books be borrowed?|two weeks|three weeks|one month|one week
lec||When can a book be renewed?|if no one else requested it|always|never|only on weekends`.split('\n'));
  window.BANCO_RAW += '\n' + L.join('\n') + '\n';
})();
