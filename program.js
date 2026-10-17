/* ============================================================
   program.js — learning program + gamification for Teacher & Student
   Loaded right after the main script in index.html. It extends the
   app (new pages, grammar modules, full course map, XP) without
   changing the main file. Methodology: "Методика: English B2+ к декабрю".
   ============================================================ */
'use strict';
(function(){
if(typeof S==='undefined'||typeof GRAMMAR==='undefined'){console.error('program.js: main app not found');return}

/* ---------- 1. Grammar modules for every Pre-intermediate lesson ---------- */
const NEWG={
 'questions-word-order':{title:'Word order in questions',level:'A2',
  en:`<p>Question word + <b>auxiliary</b> + subject + verb: <i>Where do you work? What are you doing? When did you arrive?</i></p><p>Prepositions usually go at the <b>end</b>: <i>Who did you go with? What are you talking about?</i></p>`,
  ru:'Вопросительное слово + вспомогательный глагол (do/does/did/am/is/are) + подлежащее + глагол. Предлог — в конце вопроса.',
  qs:[mc('g-qw-1','Choose the correct question.',['Where you work?','Where do you work?','Where work you?'],1,'Question word + do + subject + verb.','Вопросительное слово + do + подлежащее + глагол.'),
      ord('g-qw-2','how often do you go to the gym','Question word + auxiliary + subject + verb.','Порядок: how often + do + you + go.'),
      gap('g-qw-3','What ___ you do last weekend?',['did'],'Past question → did.','Вопрос в прошедшем — did.'),
      mc('g-qw-4','Who did you go to the cinema ___?',['with','to','for'],0,'The preposition goes at the end.','Предлог в конце вопроса.'),
      fix('g-qw-5','What time you get up?',['What time do you get up?'],'Add the auxiliary “do”.','Нужен вспомогательный do.')]},
 'connectors':{title:'Sequencers & connectors',level:'A2',
  en:`<p>Sequence: <b>First, Then, After that, Finally</b>.</p><p><b>so</b> — result, <b>because</b> — reason, <b>but / although</b> — contrast, <b>when / while</b> — time (<i>while</i> + a longer action).</p>`,
  ru:'so — следствие, because — причина, but/although — противопоставление, while — во время длительного действия.',
  qs:[mc('g-cn-1','It was raining, ___ we stayed at home.',['because','so','although'],1,'Result → so.','Следствие — so.'),
      mc('g-cn-2','We went out ___ it was raining.',['although','so','then'],0,'Contrast → although.','Противопоставление — although.'),
      gap('g-cn-3','I missed the bus ___ I got up late.',['because'],'Reason → because.','Причина — because.'),
      mc('g-cn-4','First we checked the documents. ___ we interviewed the staff.',['After that','Although','Because'],0,'Sequence → After that.','Последовательность — After that.'),
      tf('g-cn-5','“While I was working, the phone rang.” — “while” introduces the longer action.',true,'While + longer action in progress.','While — длительное действие.')]},
 'relative-clauses':{title:'Defining relative clauses',level:'B1',
  en:`<p><b>who</b> — people, <b>which</b> — things, <b>where</b> — places, <b>that</b> — people or things.</p><p>Don't repeat the subject: <i>The man who called me</i> (not <i>who he called me</i>).</p><p>If the pronoun is the object, you can leave it out: <i>The report (that) I wrote.</i></p>`,
  ru:'who — люди, which — предметы, where — места, that — люди и предметы. Не повторяйте подлежащее после who. Если местоимение — дополнение, его можно опустить.',
  qs:[mc('g-rc-1','The auditor ___ checked our documents was very strict.',['which','who','where'],1,'A person → who.','Человек — who.'),
      mc('g-rc-2','This is the system ___ stores all our contracts.',['who','where','which'],2,'A thing → which.','Предмет — which.'),
      gap('g-rc-3','That\'s the office ___ I work.',['where'],'A place → where.','Место — where.'),
      fix('g-rc-4','The man who he called me is my manager.',['The man who called me is my manager.'],'Don\'t repeat the subject after who.','Не повторяйте he после who.'),
      tf('g-rc-5','In “the report that I wrote yesterday” we can leave out “that”.',true,'Object pronouns can be omitted.','Местоимение-дополнение можно опустить.')]},
 'indefinite-pronouns':{title:'something / anything / nothing / everything',level:'A2',
  en:`<p><b>some-</b> in positive sentences and offers; <b>any-</b> in negatives and questions; <b>no-</b> = not any (with a positive verb); <b>every-</b> = all.</p><p><i>I didn't see anything = I saw nothing.</i> Never use two negatives.</p>`,
  ru:'some- — утверждение, any- — отрицание и вопрос, no- — «ничего» с утвердительным глаголом, every- — всё. Двойное отрицание нельзя.',
  qs:[mc('g-ip-1','There\'s ___ in the fridge. Let\'s go shopping.',['nothing','anything','something'],0,'Positive verb + no- = nothing.','Утвердительный глагол + nothing.'),
      mc('g-ip-2','Did you find ___ wrong in the report?',['something','anything','nothing'],1,'Question → any-.','Вопрос — any-.'),
      gap('g-ip-3','I didn\'t tell ___ about the problem. (= no person)',['anyone','anybody'],'Negative → anyone / anybody.','Отрицание — anyone.'),
      fix('g-ip-4','I didn\'t see nothing.',['I didn\'t see anything.','I saw nothing.'],'No double negatives.','Двойное отрицание нельзя.'),
      mc('g-ip-5','___ was ready on time — the whole team worked hard.',['Everything','Anything','Nothing'],0,'All things → everything.','Всё — everything.')]},
 'quantifiers':{title:'much / many / too / enough',level:'A2',
  en:`<p><b>much</b> + uncountable, <b>many</b> + countable, <b>a lot of</b> + both.</p><p><b>too</b> + adjective / <b>too much / too many</b> + noun = more than you want.</p><p>adjective + <b>enough</b> (big enough); <b>enough</b> + noun (enough chairs).</p>`,
  ru:'much — неисчисляемые, many — исчисляемые. too — слишком. enough — после прилагательного и перед существительным.',
  qs:[mc('g-qu-1','I don\'t have ___ time today.',['many','much','a few'],1,'Time is uncountable → much.','Неисчисляемое — much.'),
      mc('g-qu-2','There are ___ people in this room — we need a bigger one.',['too many','too much','enough'],0,'Countable + too → too many.','Исчисляемое — too many.'),
      gap('g-qu-3','The room isn\'t big ___ for 20 people.',['enough'],'Adjective + enough.','Прилагательное + enough.'),
      mc('g-qu-4','I drink ___ coffee. I should stop.',['too much','too many','enough'],0,'Uncountable + too → too much.','Неисчисляемое — too much.'),
      fix('g-qu-5','We don\'t have enough of chairs.',['We don\'t have enough chairs.'],'enough + noun, no “of”.','enough + существительное без of.')]},
 'will-wont':{title:'will / won\'t: predictions, decisions, promises',level:'B1',
  en:`<p><b>will</b> for predictions (<i>I think it will rain</i>), instant decisions (<i>I'll call him</i>), offers (<i>I'll help you</i>) and promises (<i>I won't tell anyone</i>).</p><p><b>Shall I / we…?</b> for offers and suggestions.</p>`,
  ru:'will — прогноз, решение в момент речи, предложение помощи, обещание. Shall I…? — предложение.',
  qs:[mc('g-ww-1','A: The phone\'s ringing. B: I ___ get it.',['\'ll','am going to','get'],0,'Instant decision → will.','Решение в момент речи.'),
      mc('g-ww-2','I promise I ___ be late again.',['don\'t','won\'t','am not'],1,'Promise → won\'t.','Обещание — won\'t.'),
      gap('g-ww-3','___ I open the window? It\'s hot in here.',['Shall'],'Offer → Shall I…?','Предложение — Shall I.'),
      mc('g-ww-4','I don\'t think the report ___ ready by Friday.',['will be','is being','be'],0,'Prediction with “I think” → will.','Прогноз — will.'),
      fix('g-ww-5','I will to send you the file tomorrow.',['I will send you the file tomorrow.'],'will + infinitive without “to”.','После will — без to.')]},
 'infinitive':{title:'Uses of the infinitive (with to)',level:'B1',
  en:`<p>After verbs: <b>want, need, decide, hope, plan, learn, promise, would like</b> + to: <i>I need to finish.</i></p><p>Purpose: <i>I came here <b>to learn</b> English</i> (not <i>for learn</i>).</p><p>After adjectives: <i>It's easy <b>to understand</b></i>. After question words: <i>I don't know <b>what to do</b></i>.</p>`,
  ru:'to + глагол: после want/need/decide/plan; для цели («чтобы»); после прилагательных; после вопросительных слов.',
  qs:[mc('g-in-1','I need ___ the report before Monday.',['finish','to finish','finishing'],1,'need + to + infinitive.','need + to.'),
      gap('g-in-2','I went to the bank ___ (get) some money.',['to get'],'Purpose → to + infinitive.','Цель — to + глагол.'),
      fix('g-in-3','I came here for learn English.',['I came here to learn English.'],'Purpose: to + infinitive, not “for”.','Цель выражается to, не for.'),
      mc('g-in-4','It\'s difficult ___ this rule.',['understand','to understand','understanding'],1,'Adjective + to + infinitive.','Прилагательное + to.'),
      ord('g-in-5','I don\'t know what to say','Question word + to + infinitive.','what + to + глагол.')]},
 'gerund':{title:'Uses of the gerund (-ing)',level:'B1',
  en:`<p>As a subject: <i><b>Swimming</b> is good for you.</i></p><p>After prepositions: <i>interested in <b>learning</b></i>.</p><p>After verbs: <b>enjoy, like, love, hate, don't mind, finish, stop, avoid, spend time</b>; and <b>look forward to</b> + -ing.</p>`,
  ru:'-ing форма: как подлежащее, после предлогов, после enjoy/finish/avoid/don\'t mind и look forward to.',
  qs:[mc('g-ge-1','I enjoy ___ new things.',['learn','to learn','learning'],2,'enjoy + -ing.','enjoy + -ing.'),
      gap('g-ge-2','I\'m interested in ___ (work) abroad.',['working'],'Preposition + -ing.','После предлога — -ing.'),
      mc('g-ge-3','___ is the best way to start the day.',['Run','Running','To running'],1,'-ing as the subject.','-ing как подлежащее.'),
      fix('g-ge-4','I\'m looking forward to meet you.',['I\'m looking forward to meeting you.','I am looking forward to meeting you.'],'look forward to + -ing.','look forward to + -ing.'),
      mc('g-ge-5','She finished ___ the documents at six.',['checking','to check','check'],0,'finish + -ing.','finish + -ing.')]},
 'possessive-pronouns':{title:'Possessive adjectives & pronouns',level:'A2',
  en:`<p>my → <b>mine</b>, your → <b>yours</b>, his → <b>his</b>, her → <b>hers</b>, our → <b>ours</b>, their → <b>theirs</b>.</p><p><i>Whose is this? — It's mine.</i> No apostrophe in <b>its, yours, hers</b>.</p>`,
  ru:'Притяжательные местоимения: mine, yours, his, hers, ours, theirs. Whose — «чей». Без апострофа: its, yours.',
  qs:[mc('g-po-1','Is this your laptop? — Yes, it\'s ___.',['my','mine','me'],1,'Without a noun → mine.','Без существительного — mine.'),
      mc('g-po-2','These aren\'t our files. They\'re ___.',['their','theirs','them'],1,'Without a noun → theirs.','theirs.'),
      gap('g-po-3','___ phone is this? — It\'s Ali\'s.',['Whose'],'Whose = чей.','Whose — чей.'),
      fix('g-po-4','This pen is your\'s.',['This pen is yours.'],'No apostrophe in yours.','yours без апострофа.'),
      mc('g-po-5','The company changed ___ logo.',['it\'s','its','his'],1,'its = possessive; it\'s = it is.','its — притяжательное.')]},
 'for-since':{title:'Present Perfect + for / since',level:'B1',
  en:`<p><b>How long have you…?</b> — Present Perfect for situations that started in the past and continue now.</p><p><b>for</b> + a period (for ten years), <b>since</b> + a starting point (since 2019).</p>`,
  ru:'How long have you…? — ситуация началась в прошлом и продолжается. for — период, since — точка отсчёта.',
  qs:[mc('g-fs-1','I\'ve worked here ___ 2019.',['for','since','ago'],1,'A starting point → since.','Точка отсчёта — since.'),
      mc('g-fs-2','She has known him ___ ten years.',['since','for','during'],1,'A period → for.','Период — for.'),
      gap('g-fs-3','How long ___ you lived in Astana?',['have'],'How long + have + subject + past participle.','How long have you…'),
      fix('g-fs-4','I know her since 2015.',['I have known her since 2015.','I\'ve known her since 2015.'],'Unfinished period → Present Perfect.','Незаконченный период — Present Perfect.'),
      ord('g-fs-5','how long have you been a specialist','How long + have + subject + been.','Порядок слов вопроса.')]},
 'used-to':{title:'used to',level:'B1',
  en:`<p><b>used to</b> + infinitive — past habits and states that are not true now: <i>I used to smoke.</i></p><p>Negative: <b>didn't use to</b>. Question: <b>Did you use to…?</b></p>`,
  ru:'used to — привычка или состояние в прошлом, которых сейчас нет. didn\'t use to, Did you use to…?',
  qs:[mc('g-ut-1','I ___ smoke, but I stopped five years ago.',['use to','used to','was used to'],1,'Past habit → used to.','Прошлая привычка — used to.'),
      gap('g-ut-2','I didn\'t ___ like coffee, but now I love it.',['use to'],'didn\'t + use to.','После didn\'t — use to.'),
      mc('g-ut-3','___ you use to play football at school?',['Did','Do','Were'],0,'Question → Did you use to…?','Вопрос — Did.'),
      fix('g-ut-4','When I was a child, I use to live in Aktobe.',['When I was a child, I used to live in Aktobe.'],'Positive → used to.','В утверждении — used to.'),
      tf('g-ut-5','“I used to work here” means I still work here.',false,'used to = not true now.','used to — сейчас уже не так.')]},
 'might':{title:'might / may (possibility)',level:'B1',
  en:`<p><b>might / may</b> + infinitive = perhaps: <i>It might rain.</i> Negative: <b>might not</b>.</p><p>No “to” after might: <i>She might be late.</i></p>`,
  ru:'might/may — возможно. Отрицание might not. После might — без to.',
  qs:[mc('g-mi-1','Take an umbrella. It ___ rain later.',['might','must','should'],0,'Possibility → might.','Возможность — might.'),
      mc('g-mi-2','I\'m not sure. I ___ come to the party.',['might not','mightn\'t to','don\'t might'],0,'Negative → might not.','Отрицание — might not.'),
      gap('g-mi-3','The meeting ___ be cancelled — the boss is ill. (possibility)',['might','may'],'might / may + infinitive.','might/may.'),
      fix('g-mi-4','She might to be late.',['She might be late.'],'No “to” after might.','После might без to.'),
      tf('g-mi-5','“He might be in the office” means I\'m sure he is there.',false,'might = perhaps, not sure.','might — не уверен.')]},
 'phrasal-verbs':{title:'Phrasal verbs & word order',level:'B1',
  en:`<p>Separable verbs: <i>turn on the light / turn the light on / <b>turn it on</b></i> (not <i>turn on it</i>).</p><p>Common: look up, put off, pick up, turn off, give up, look after, get on with.</p>`,
  ru:'Если дополнение — местоимение, оно стоит между глаголом и частицей: turn it on, pick me up.',
  qs:[mc('g-ph-1','This is your coat. Please ___.',['put on it','put it on','it put on'],1,'Pronoun between verb and particle.','Местоимение — между глаголом и частицей.'),
      gap('g-ph-2','Please turn ___ your phones during the meeting. (= switch off)',['off'],'turn off = switch off.','turn off — выключить.'),
      fix('g-ph-3','Can you pick up me at six?',['Can you pick me up at six?'],'Pronoun goes between verb and particle.','pick me up.'),
      mc('g-ph-4','I need to ___ this word in a dictionary.',['look up','look after','look for'],0,'look up = find information.','look up — найти в словаре.'),
      mc('g-ph-5','We had to ___ the meeting until Monday.',['put off','put on','take off'],0,'put off = postpone.','put off — отложить.')]},
 'so-neither':{title:'so / neither + auxiliaries',level:'B1',
  en:`<p>Agree with a positive: <b>So + auxiliary + I</b> (So do I, So am I, So did I).</p><p>Agree with a negative: <b>Neither + auxiliary + I</b> (Neither do I, Neither can I).</p><p>Use the auxiliary of the original sentence.</p>`,
  ru:'Согласие с утверждением: So do I. С отрицанием: Neither do I. Вспомогательный глагол — из исходной фразы.',
  qs:[mc('g-sn-1','A: I love coffee. B: ___.',['So do I','Neither do I','So am I'],0,'Positive, Present Simple → So do I.','So do I.'),
      mc('g-sn-2','A: I\'m not tired. B: ___.',['So am I','Neither am I','Neither do I'],1,'Negative with be → Neither am I.','Neither am I.'),
      gap('g-sn-3','A: I went to the meeting. B: So ___ I.',['did'],'Past → did.','Прошедшее — did.'),
      mc('g-sn-4','A: I can\'t swim. B: ___.',['Neither can I','So can I','Neither do I'],0,'Negative with can → Neither can I.','Neither can I.'),
      fix('g-sn-5','A: I have finished. B: So I have.',['So have I.','So have I'],'So + auxiliary + subject.','So + have + I.')]},
 'past-perfect':{title:'Past Perfect',level:'B1',
  en:`<p><b>had + past participle</b> — an action that happened <b>before</b> another past action: <i>When we arrived, the train had left.</i></p>`,
  ru:'Past Perfect (had + 3-я форма) — действие, произошедшее раньше другого действия в прошлом.',
  qs:[mc('g-pf-1','When we arrived, the train ___.',['left','had left','has left'],1,'Earlier past → had left.','Раньше другого действия — had left.'),
      gap('g-pf-2','I couldn\'t log in because I ___ (forget) my password.',['had forgotten'],'had + past participle.','had forgotten.'),
      mc('g-pf-3','She was nervous because she ___ never flown before.',['has','had','was'],1,'Past Perfect → had.','had flown.'),
      fix('g-pf-4','After he had finish the report, he went home.',['After he had finished the report, he went home.'],'had + past participle (finished).','had finished.'),
      tf('g-pf-5','“When I got home, my wife had cooked dinner” — dinner was ready before I arrived.',true,'Past Perfect = earlier action.','Ужин был готов раньше.')]},
 'reported-speech':{title:'Reported speech',level:'B1+',
  en:`<p>Tenses move back: am → was, will → would, can → could.</p><p><b>tell</b> + person (<i>He told me</i>), <b>say</b> without a person (<i>He said that…</i>).</p><p>Questions: <i>She asked <b>if / where</b> + statement word order</i>.</p>`,
  ru:'В косвенной речи время сдвигается назад. tell + кому, say — без. Косвенный вопрос — прямой порядок слов.',
  qs:[mc('g-rs-1','“I am tired,” she said. → She said she ___ tired.',['is','was','has been'],1,'am → was.','am → was.'),
      mc('g-rs-2','He ___ me that the meeting was cancelled.',['said','told','asked'],1,'tell + person.','tell + кому.'),
      gap('g-rs-3','“I will call you.” → He said he ___ call me.',['would'],'will → would.','will → would.'),
      fix('g-rs-4','She asked me where did I work.',['She asked me where I worked.'],'Reported question: statement word order.','Прямой порядок слов.'),
      mc('g-rs-5','“Can you help?” → She asked ___ I could help.',['that','if','what'],1,'Yes/no question → if.','Общий вопрос — if.')]},
 'subject-questions':{title:'Questions without auxiliaries',level:'B1',
  en:`<p>When <b>Who / What</b> is the subject, don't use do / does / did: <i>Who called you? What happened?</i></p><p>When it is the object, use the auxiliary: <i>Who did you call?</i></p>`,
  ru:'Если who/what — подлежащее, вспомогательный глагол не нужен: Who called you? Если дополнение — нужен: Who did you call?',
  qs:[mc('g-sq-1','___ the report? — Aliya wrote it.',['Who did write','Who wrote','Who writes did'],1,'Subject question → no did.','Вопрос к подлежащему — без did.'),
      mc('g-sq-2','What ___ at the meeting yesterday?',['did happen','happened','happen'],1,'What is the subject → happened.','What — подлежащее.'),
      fix('g-sq-3','Who did invent the telephone?',['Who invented the telephone?'],'Subject question → no auxiliary.','Без вспомогательного глагола.'),
      mc('g-sq-4','Who ___ you yesterday? — My manager called me.',['called','did call','did called'],0,'Subject question → called.','Вопрос к подлежащему.'),
      tf('g-sq-5','In “Who did you call?”, “who” is the object, so we use “did”.',true,'Object question → auxiliary.','Вопрос к дополнению — с did.')]},
 'movement-prepositions':{title:'Prepositions of movement',level:'A2',
  en:`<p><b>across, along, over, under, through, into, out of, up, down, past, towards, round</b>.</p><p><i>Walk across the bridge. Drive through the tunnel. Go into the room.</i></p>`,
  ru:'Предлоги движения: across — через (поперёк), along — вдоль, through — сквозь, into — внутрь, over — над/через.',
  qs:[mc('g-mv-1','The car drove ___ the tunnel.',['through','over','across'],0,'Inside something from one end to the other → through.','Сквозь — through.'),
      mc('g-mv-2','He walked ___ the room and closed the door.',['into','in','on'],0,'Movement inside → into.','Внутрь — into.'),
      gap('g-mv-3','Walk ___ the bridge to the other side of the river.',['across','over'],'From one side to the other → across / over.','Через — across.'),
      mc('g-mv-4','The cat jumped ___ the fence.',['over','through','along'],0,'Above something → over.','Над — over.'),
      mc('g-mv-5','We walked ___ the river for an hour.',['along','across','into'],0,'Following a line → along.','Вдоль — along.')]},
 'review-tenses':{title:'Review of verb forms',level:'B1',
  en:`<p>Present Simple / Continuous, Past Simple / Continuous, Present Perfect, future forms — choose by meaning: habit, now, finished past, past-to-now, plan.</p>`,
  ru:'Повторение времён: выбирайте время по смыслу — привычка, сейчас, законченное прошлое, период до сейчас, план.',
  qs:[mc('g-rv-1','I ___ in this company since 2020.',['work','have worked','worked'],1,'Since + unfinished period → Present Perfect.','Since — Present Perfect.'),
      mc('g-rv-2','Look! The manager ___ to the director.',['talks','is talking','talked'],1,'Now → Present Continuous.','Сейчас — Continuous.'),
      gap('g-rv-3','Yesterday I ___ (send) the report to head office.',['sent'],'Yesterday → Past Simple; send → sent.','Вчера — Past Simple.'),
      mc('g-rv-4','Next week we ___ an audit. It\'s already arranged.',['have','are having','had'],1,'Arrangement → Present Continuous.','Договорённость — Present Continuous.'),
      fix('g-rv-5','When I came, they have already left.',['When I came, they had already left.'],'Earlier past → Past Perfect.','Раньше другого прошлого — had left.')]}
};
Object.entries(NEWG).forEach(([k,g])=>{g.qs.forEach(q=>Object.assign(q,{topic:k,skill:'grammar',level:g.level}));GRAMMAR[k]=g});
Object.assign(PL_GKEY,{'Reported speech':'reported-speech','Past Perfect':'past-perfect','Gerunds & infinitives':'gerund','Phrasal verbs':'phrasal-verbs','Quantifiers':'quantifiers'});

/* extra vocabulary packs for the lesson topics */
VOCAB_LIB.push(
 ['suit','/suːt/','костюм','He wears a suit to work.','clothes'],['jacket','/ˈdʒækɪt/','куртка, пиджак','Take a jacket — it\'s cold.','clothes'],['trousers','/ˈtraʊzəz/','брюки','These trousers are too long.','clothes'],['tie','/taɪ/','галстук','You don\'t need a tie today.','clothes'],['try on','/traɪ ɒn/','примерять','Can I try on this shirt?','clothes'],
 ['tidy','/ˈtaɪdi/','убирать; опрятный','Please tidy your desk.','house'],['do the washing-up','/ˌwɒʃɪŋ ˈʌp/','мыть посуду','I do the washing-up after dinner.','house'],['make the bed','/meɪk ðə bed/','заправлять кровать','I make the bed every morning.','house'],['housework','/ˈhaʊswɜːk/','работа по дому','We share the housework.','house'],['do the ironing','/ˈaɪənɪŋ/','гладить бельё','I hate doing the ironing.','house'],
 ['crowded','/ˈkraʊdɪd/','многолюдный','The bus was very crowded.','city'],['polluted','/pəˈluːtɪd/','загрязнённый','The air here is polluted.','city'],['suburbs','/ˈsʌbɜːbz/','пригород','They live in the suburbs.','city'],['square','/skweə/','площадь','Meet me in the main square.','city'],['nightlife','/ˈnaɪtlaɪf/','ночная жизнь','The city has great nightlife.','city'],
 ['diet','/ˈdaɪət/','рацион, диета','A healthy diet is important.','health'],['healthy','/ˈhelθi/','здоровый','I try to eat healthy food.','health'],['stress','/stres/','стресс','Work causes a lot of stress.','health'],['exercise','/ˈeksəsaɪz/','физические упражнения','I exercise three times a week.','health'],['sleep well','/sliːp wel/','хорошо спать','Did you sleep well?','health'],
 ['subject','/ˈsʌbdʒɪkt/','предмет','Maths was my favourite subject.','school'],['exam','/ɪɡˈzæm/','экзамен','I have an exam on Monday.','school'],['pass','/pɑːs/','сдать (экзамен)','She passed all her exams.','school'],['fail','/feɪl/','провалить','He failed the driving test.','school'],['strict','/strɪkt/','строгий','Our teacher was very strict.','school'],
 ['wild','/waɪld/','дикий','Wild animals live in the forest.','animals'],['spider','/ˈspaɪdə/','паук','I\'m afraid of spiders.','animals'],['snake','/sneɪk/','змея','A snake bit him.','animals'],['afraid of','/əˈfreɪd ɒv/','бояться','She\'s afraid of dogs.','animals'],['bee','/biː/','пчела','A bee stung me.','animals'],
 ['win','/wɪn/','выигрывать','We won the match.','sport'],['lose','/luːz/','проигрывать','They lost 2–0.','sport'],['score','/skɔː/','забить; счёт','He scored a goal.','sport'],['team','/tiːm/','команда','Our team is the best.','sport'],['referee','/ˌrefəˈriː/','судья','The referee stopped the game.','sport'],
 ['receipt','/rɪˈsiːt/','чек','Keep the receipt.','shopping'],['refund','/ˈriːfʌnd/','возврат денег','Can I have a refund?','shopping'],['size','/saɪz/','размер','What size are you?','shopping'],['bargain','/ˈbɑːɡən/','выгодная покупка','This coat was a bargain.','shopping'],['changing room','/ˈtʃeɪndʒɪŋ ruːm/','примерочная','Where is the changing room?','shopping']
);

/* ---------- 2. Full English File Pre-intermediate map (Files 1–12) ---------- */
const PI_MAP=[
 [1,'Questions & present tenses',[['1A','Word order in questions','questions-word-order','family'],['1B','Present Simple','present-simple-continuous','family'],['1C','Present Continuous','present-simple-continuous','clothes']]],
 [2,'Past tenses',[['2A','Past Simple','past-simple','travel'],['2B','Past Continuous','past-continuous','travel'],['2C','Sequencers & connectors','connectors','feelings']]],
 [3,'Future & relative clauses',[['3A','be going to','future-forms','travel'],['3B','Present Continuous for arrangements','future-forms','work'],['3C','Defining relative clauses','relative-clauses','work']]],
 [4,'Present Perfect',[['4A','Present Perfect + yet, just, already','present-perfect','house'],['4B','Present Perfect or Past Simple','present-perfect','shopping'],['4C','something / anything / nothing','indefinite-pronouns','feelings']]],
 [5,'Comparing & quantities',[['5A','Comparatives, as … as','comparatives','work'],['5B','Superlatives + ever','comparatives','city'],['5C','Quantifiers, too, not enough','quantifiers','health']]],
 [6,'will & review',[['6A','will / won\'t: predictions','will-wont','feelings'],['6B','will / won\'t: decisions & promises','will-wont','work'],['6C','Review of verb forms','review-tenses','feelings']]],
 [7,'Infinitive, gerund, obligation',[['7A','Infinitive with to','infinitive','work'],['7B','Gerund (-ing)','gerund','feelings'],['7C','have to, must, mustn\'t','modals-obligation','school']]],
 [8,'Advice & conditions',[['8A','should','modals-obligation','work'],['8B','First conditional','conditionals','feelings'],['8C','Possessive pronouns','possessive-pronouns','family']]],
 [9,'Imagination & duration',[['9A','Second conditional','conditionals','animals'],['9B','Present Perfect + for / since','for-since','feelings'],['9C','Present Perfect or Past Simple (2)','present-perfect','work']]],
 [10,'Passive & past habits',[['10A','Passive','passive','work'],['10B','used to','used-to','school'],['10C','might','might','work']]],
 [11,'Movement & phrasal verbs',[['11A','Prepositions of movement','movement-prepositions','sport'],['11B','Phrasal verbs','phrasal-verbs','work'],['11C','so / neither + auxiliaries','so-neither','family']]],
 [12,'Narrative & reporting',[['12A','Past Perfect','past-perfect','feelings'],['12B','Reported speech','reported-speech','work'],['12C','Questions without auxiliaries','subject-questions','school']]]
];
const pageOf=(n,i)=>4+(n-1)*12+i*4; /* approximate — check against your book */
function piFiles(){return PI_MAP.map(([n,title,ls])=>({n,title,lessons:ls.map((l,i)=>({id:'pi-'+l[0],code:l[0],title:l[1],grammar:l[2],vocab:l[3],page:pageOf(n,i)}))}))}
SEED_COURSE[0].files=PI_MAP.map(([n,title,ls])=>({n,title,lessons:ls.map((l,i)=>['pi-'+l[0],l[0],l[1],l[2],l[3],pageOf(n,i)])}));

/* ---------- 3. Program + game state ---------- */
const DEBTS=['pi-3B','pi-3C','pi-4C','pi-7A'];
const PHASES=['Diagnostics','Grand Audit','Course: Files 1–12','Final check'];
const RANKS=[[0,'Intern'],[500,'Junior Debugger'],[1500,'Middle Developer'],[3000,'Senior Engineer'],[5000,'Tech Lead'],[8000,'Solution Architect'],[12000,'Principal Engineer']];
const SKILLS=[['grammar','Grammar','📐'],['vocab','Vocabulary','🃏'],['reading','Reading','📖'],['listening','Listening','🎧'],['writing','Writing','✍️'],['pron','Pronunciation','👄']];
const SKILLMAP=Object.fromEntries(SKILLS.map(s=>[s[0],s]));
const STAGES=[['audit','Dynamic Audit',7,'6 questions: your past bugs from the mistakes bank + the previous topic.','grammar'],
 ['teardown','Grammar Teardown',8,'Read the rule (you read the Student\'s Book at home). Fix only what is unclear.','grammar'],
 ['drills','Heavy Drills',15,'Lesson exercises on the site, then the Workbook exercises for this lesson.','grammar'],
 ['skill','Skill block',7,'A text or a recording at lesson level with questions.','reading'],
 ['boss','Boss Level',8,'80–120 words on a work topic using this lesson\'s grammar.','writing']];
const BOSS_PROMPTS={
 'future-forms':'Write an email to a colleague about your plans and fixed arrangements for next week (meetings, a review, deadlines). Use “going to” and the Present Continuous.',
 'relative-clauses':'Describe three roles or documents in your department: “The risk owner is the person who…”, “The control matrix is a document which…”. Use who / which / where / that.',
 'indefinite-pronouns':'Write a short audit note: what you checked and what you found. Use something / anything / nothing / everything / someone / no one.',
 'infinitive':'Write about your goals for this quarter: what you want, plan, need and hope to do, and why (to + infinitive for purpose).',
 'present-perfect':'Write a status update for your manager: what you have already done, what you haven\'t done yet, and what you have just finished.',
 'present-simple-continuous':'Describe your typical working day and what you are working on this week.',
 'questions-word-order':'Write 8–10 questions you would ask a new colleague or a process owner during an interview.',
 'past-simple':'Describe a past project or business trip: what happened, step by step.',
 'past-continuous':'Describe an incident at work: what was happening when something unexpected happened.',
 'connectors':'Describe how a document goes through approval: first, then, after that, finally — with because / so / although.',
 'comparatives':'Compare two systems, tools or processes you use at work. Which is faster, more reliable, the best?',
 'quantifiers':'Describe your workload: too much / too many / not enough / a lot of.',
 'will-wont':'Reply to a colleague with offers and promises: “I\'ll send…”, “I won\'t forget…”, and one prediction.',
 'review-tenses':'Write about your career: what you did before, what you have done here, what you are doing now and what you are going to do.',
 'gerund':'Write about what you enjoy, avoid and look forward to in your job.',
 'modals-obligation':'Write instructions for a new colleague: what they must, have to, don\'t have to and should do in their first week.',
 'conditionals':'Write about risks: “If the supplier is late, we will…”, and one imaginary situation: “If I were the director, I would…”.',
 'possessive-pronouns':'Describe who is responsible for what in your team: “This process is ours, that one is theirs…”.',
 'for-since':'Write about your experience: how long you have worked here, since when you have done each task.',
 'passive':'Describe a work process in the passive: how a document is prepared, checked and approved.',
 'used-to':'Compare how your work used to be five years ago and how it is now.',
 'might':'Write about possible risks for next month: what might happen and what might not.',
 'movement-prepositions':'Describe the route from your office entrance to your desk or to a meeting room.',
 'phrasal-verbs':'Write a short message rescheduling a meeting: put off, call back, look into, find out.',
 'so-neither':'Write a short dialogue with a colleague agreeing about work: So do I / Neither have I.',
 'past-perfect':'Tell the story of a problem at work: what had happened before you noticed it.',
 'reported-speech':'Report a recent meeting: what people said, told you and asked.',
 'subject-questions':'Write 6 questions for an incident review: Who reported…? What happened…? Who did you inform…?',
 default:'Write 80–120 words about your work using the grammar of this lesson.'};
const BADGES=[
 ['placement','🎯','First placement test',()=>!!lastPlacement()],
 ['scan12','🔍','Audit scan of all 12 Files',()=>Object.keys(S.program.scan).length>=12],
 ['streak7','🔥','7-day streak',()=>calcStreak()>=7],
 ['streak30','🌋','30-day streak',()=>calcStreak()>=30],
 ['words100','🃏','100 words learned',()=>learned()>=100],
 ['words300','📚','300 words learned',()=>learned()>=300],
 ['sprint1','🏃','First sprint',()=>sprintsDone()>=1],
 ['sprint10','⚙️','10 sprints',()=>sprintsDone()>=10],
 ['perfect','💯','Perfect Heavy Drills',()=>(S.program.perfect||0)>=1],
 ['boss1','⚔️','First boss defeated',()=>bossesWon()>=1],
 ['audit','🧾','Grand Audit closed',()=>!!(S.program.auditBoss&&S.program.auditBoss.won)],
 ['writer10','✍️','10 texts sent to the teacher',()=>S.subs.filter(s=>s.type==='writing').length>=10],
 ['bosses12','👑','All 12 bosses defeated',()=>bossesWon()>=12]];

function newGame(){return {xp:0,skillXp:{},week:{},badges:{},shields:0,shieldDays:[],shieldLvl:0,shieldCheck:'',log:[]}}
function newProgram(){return {started:new Date().toISOString(),scan:{},debts:DEBTS.slice(),debtsDone:{},bosses:{},auditBoss:null,sprints:{},daily:{},perfect:0}}
function ensure(){
 if(!S.game||typeof S.game!=='object')S.game=newGame();else{const b=newGame();Object.keys(b).forEach(k=>{if(S.game[k]==null)S.game[k]=b[k]})}
 if(!S.program||typeof S.program!=='object')S.program=newProgram();else{const b=newProgram();Object.keys(b).forEach(k=>{if(S.program[k]===undefined)S.program[k]=b[k]})}
 if(!Array.isArray(S.course))return;
 const pi=S.course.find(b=>b.id==='pi');
 if(pi&&pi.v!==2){pi.files=piFiles();pi.v=2}
}
const piBook=()=>Array.isArray(S.course)?S.course.find(b=>b.id==='pi'):null;
const lessonsOf=n=>{const pi=piBook();const f=pi&&pi.files.find(x=>x.n===n);return f?f.lessons:[]};
const piLessons=()=>{const pi=piBook();return pi?pi.files.flatMap(f=>f.lessons):[]};
const lessonDoneId=id=>!!(S.lessonProgress[id]&&S.lessonProgress[id].done);
const learned=()=>S.vocab.filter(c=>c.reps>=2).length;
const sprintsDone=()=>Object.values(S.program.sprints).filter(s=>s.done).length;
const bossesWon=()=>Object.values(S.program.bosses).filter(b=>b&&b.won).length;
const wk=(d=new Date())=>dkey(addDays(d,-((d.getDay()+6)%7)));
const rankOf=xp=>{let i=0;RANKS.forEach((r,k)=>{if(xp>=r[0])i=k});return {i,name:RANKS[i][1],min:RANKS[i][0],next:RANKS[i+1]||null}};
const isStudent=()=>S&&S.role==='student';

/* streak counts days saved by a shield */
calcStreak=function(){const sd=(S.game&&S.game.shieldDays)||[];const on=k=>!!S.activity[k]||sd.includes(k);let d=new Date();if(!on(dkey(d)))d=addDays(d,-1);let n=0;while(on(dkey(d))){n++;d=addDays(d,-1)}return n};

/* ---------- 4. XP, daily quests, shields, badges ---------- */
function logXp(n,why){const g=S.game;g.log.unshift({d:new Date().toISOString(),xp:n,why});g.log=g.log.slice(0,80)}
function award(n,skill,why){
 if(!isStudent()||!n)return;ensure();const g=S.game;n=Math.round(n);const before=rankOf(g.xp).i;g.xp+=n;
 if(skill){g.skillXp[skill]=(g.skillXp[skill]||0)+n;const w=wk();g.week[w]=g.week[w]||{};g.week[w][skill]=(g.week[w][skill]||0)+n;
  const ks=Object.keys(g.week).sort();while(ks.length>10)delete g.week[ks.shift()];const d=daily();d.sx[skill]=(d.sx[skill]||0)+n}
 if(why)logXp(n,why);
 const r=rankOf(g.xp);if(r.i>before)setTimeout(()=>toast('🎖️ New rank: '+r.name+'!'),400);
 chip();checkDaily();shieldsEarn();checkBadges();
}
function wSkill(){const w=S.game.week[wk()]||{};const c=['listening','reading','pron'];const off=new Date().getDate()%3;const rot=c.slice(off).concat(c.slice(0,off));return rot.reduce((a,b)=>(w[b]||0)<(w[a]||0)?b:a)}
function daily(){const P=S.program,k=dkey();let d=P.daily[k];
 if(!d){d=P.daily[k]={due:Math.min(10,dueCards().length),cards:0,drill:0,skill:wSkill(),sx:{},bonus:false};const ks=Object.keys(P.daily).sort();while(ks.length>14)delete P.daily[ks.shift()]}
 d.sx=d.sx||{};return d}
function quests(d){
 const t=d.due,sk=SKILLMAP[d.skill]||SKILLMAP.listening;const route={listening:"go('/listening')",reading:"go('/reading')",pron:"go('/pronunciation')"}[d.skill]||"go('/listening')";
 const sl=sprintLesson();const fromBank=S.mistakes.length>=3;
 return [
  {id:'cards',title:t?`Review ${t} card${t===1?'':'s'}`:'No cards due today',sub:t?`${Math.min(d.cards,t)}/${t} · spaced repetition`:'Add new words in Vocabulary → My words → topic packs',done:d.cards>=t,js:'A.startReview()'},
  {id:'drill',title:'Micro-drill: 5 grammar answers',sub:`${Math.min(d.drill,5)}/5 · ${fromBank?'from your mistakes bank':'current topic'}`,done:d.drill>=5,js:fromBank?'A.reviewMistakes()':`A.startTopic('${(sl&&GRAMMAR[sl.grammar])?sl.grammar:weakestTopic()}')`},
  {id:'skill',title:`${sk[2]} ${sk[1]}: earn 20 XP`,sub:`${Math.min(d.sx[d.skill]||0,20)}/20 XP · your weakest skill this week`,done:(d.sx[d.skill]||0)>=20,js:route}];
}
function checkDaily(){if(!isStudent())return;const d=daily();if(d.bonus)return;
 if(quests(d).every(q=>q.done)){d.bonus=true;const n=30+Math.min(50,5*calcStreak());award(n,null,'Daily quests complete');setTimeout(()=>toast(`✅ Daily quests done! +${n} XP`),200)}}
function shieldsEarn(){if(!isStudent())return;const g=S.game;const lvl=Math.floor(calcStreak()/7);if(lvl>g.shieldLvl&&g.shields<2){g.shields++;setTimeout(()=>toast('🛡️ Streak shield earned!'),600)}g.shieldLvl=lvl}
function shieldsDaily(){const g=S.game;if(g.shieldCheck===dkey())return;g.shieldCheck=dkey();
 const on=k=>!!S.activity[k]||g.shieldDays.includes(k);let d=addDays(new Date(),-1);const miss=[];
 while(!on(dkey(d))&&miss.length<3){miss.push(dkey(d));d=addDays(d,-1)}
 if(miss.length&&miss.length<3&&on(dkey(d))&&g.shields>=miss.length){g.shieldDays.push(...miss);g.shieldDays=g.shieldDays.slice(-30);g.shields-=miss.length;setTimeout(()=>toast(`🛡️ ${miss.length===1?'A shield':'Two shields'} saved your streak`),500)}
 save()}
function checkBadges(){if(!isStudent())return;const g=S.game;let k=0;
 BADGES.forEach(b=>{if(g.badges[b[0]])return;let ok=false;try{ok=b[3]()}catch(e){}if(ok){g.badges[b[0]]=new Date().toISOString();const t=b[1]+' Badge: '+b[2];setTimeout(()=>toast(t),900+k++*1600)}})}
function chipHtml(){const g=S.game,r=rankOf(g.xp);return `🎖️ ${g.xp}<span class="full">&nbsp;XP · ${esc(r.name)}</span> · 🔥${calcStreak()}${g.shields?' · 🛡️'+g.shields:''}`}
function chip(){const el=$('#xpchip');if(el&&S.game)el.innerHTML=chipHtml()}

/* ---------- 5. Program logic: next step, sprint lesson, runs ---------- */
function sprintLesson(){const P=S.program;
 for(const id of P.debts){if(!P.debtsDone[id]&&findLesson(id))return findLesson(id)}
 const pi=piBook();if(pi)for(const f of pi.files){if(P.bosses[f.n]&&P.bosses[f.n].won)continue;const l=f.lessons.find(x=>!lessonDoneId(x.id));if(l)return findLesson(l.id)}
 const all=piLessons();return all.length?findLesson(all[all.length-1].id):allLessons()[0]}
function prevLesson(L){const all=piLessons();const i=all.findIndex(l=>l.id===L.id);return i>0?all[i-1]:null}
function nextStep(){const P=S.program;
 if(!lastPlacement())return {phase:0,label:'Take the placement test',hint:'~30 min · adaptive · gives your CEFR level per skill',js:"go('/placement')"};
 const hook=window.TS_MATERIALS&&TS_MATERIALS.nextStepHook&&TS_MATERIALS.nextStepHook();if(hook)return hook;
 for(let n=1;n<=12;n++)if(!P.scan[n]&&lessonsOf(n).length)return {phase:0,label:`Audit scan · File ${n}`,hint:'6 questions · ~5 min',js:`A.gScan(${n})`};
 const debt=P.debts.find(id=>!P.debtsDone[id]);
 if(debt){const l=findLesson(debt);return {phase:1,label:`Grand Audit · ${l?l.code+' '+l.title:debt}`,hint:'Sprint on this lesson — 80%+ in Heavy Drills closes the debt',js:"go('/sprint')"}}
 if(!(P.auditBoss&&P.auditBoss.won))return {phase:1,label:'Boss · Grand Audit',hint:'12 questions · 10 min · 80% to win',js:'A.gAuditBoss()'};
 const pi=piBook();if(pi)for(const f of pi.files){if(P.bosses[f.n]&&P.bosses[f.n].won)continue;const l=f.lessons.find(x=>!lessonDoneId(x.id));
  if(l)return {phase:2,label:`Sprint · ${l.code} ${l.title}`,hint:`File ${f.n} · ${f.title}`,js:"go('/sprint')"};
  return {phase:2,label:`Boss · File ${f.n}`,hint:'10 questions · 8 min · 80% to win',js:`A.gBoss(${f.n})`}}
 return {phase:3,label:'Final check: retake the placement test',hint:'Ask your teacher to allow a retake if the button is locked',js:"go('/placement')"}}
function sprintRec(create=true){const P=S.program,k=dkey();let rec=P.sprints[k];if(!rec&&create){const L=sprintLesson();rec=P.sprints[k]={lesson:L?L.id:'',stages:{},done:false,text:''}}return rec}
function sprintCheck(rec){if(rec&&!rec.done&&STAGES.every(s=>rec.stages[s[0]])){rec.done=true;award(50,null,'Sprint complete');setTimeout(()=>toast('🏁 Sprint complete! +50 XP'),300)}}
function pickRR(mods,count){const pools=[...new Set(mods)].filter(k=>GRAMMAR[k]).map(k=>shuffle(GRAMMAR[k].qs));const out=[];let i=0;
 while(out.length<count&&pools.some(p=>p.length)){const p=pools[i%pools.length];if(p.length)out.push(p.shift());i++}return out}
function markLessons(ls,score){ls.forEach(l=>{const p=S.lessonProgress[l.id]||{best:0,done:false};p.best=Math.max(p.best,score);p.done=true;S.lessonProgress[l.id]=p})}
const runScore=r=>{const t=r.answers.length;return t?r.answers.filter(a=>a.ok).length/t:0};

/* XP for every correct answer + daily drill counter */
const _submit=submit;
submit=function(g){const r=RUN,q=r&&r.q;
 if(q&&isStudent()){const ok=checkAnswer(q,g);const sk=q.skill==='vocabulary'?'vocab':(q.skill||'grammar');
  if(sk==='grammar'){daily().drill++}
  if(ok&&!r.blockXp){const fixed=!!r.clearMistakes&&S.mistakes.some(m=>m.qid===q.id);const n=fixed?15:10;r._xp=(r._xp||0)+n;award(n,sk)}else checkDaily()}
 _submit(g)};
/* after every finished run: log XP, close Grand Audit debts, tick sprint stages */
const _finishRun=finishRun;
finishRun=function(){const r=RUN;_finishRun();try{afterRun(r)}catch(e){console.error(e)}};
function afterRun(r){if(!r||!isStudent()||!r.answers||!r.answers.length)return;const P=S.program,pct=runScore(r);
 if(r._xp)logXp(r._xp,r.title);
 if(r.lessonId&&P.debts.includes(r.lessonId)&&pct>=0.8&&!P.debtsDone[r.lessonId]){P.debtsDone[r.lessonId]=new Date().toISOString();const l=findLesson(r.lessonId);award(100,'grammar','Grand Audit: '+(l?l.code:'')+' closed');setTimeout(()=>toast('🧾 Grand Audit debt '+(l?l.code:'')+' closed! +100 XP'),500)}
 if(r.sprintStage){const rec=sprintRec();const st=STAGES.find(s=>s[0]===r.sprintStage);
  if(st&&!rec.stages[st[0]]){rec.stages[st[0]]=true;award(20,st[0]==='skill'?(r.kind==='listening'?'listening':'reading'):st[4],'Sprint stage: '+st[1])}
  if(r.sprintStage==='drills'&&pct===1&&r.answers.length>=5)P.perfect=(P.perfect||0)+1;
  sprintCheck(rec)}
 checkBadges();save();render()}
const _startLesson=A.startLesson;
A.startLesson=(id,hw)=>{_startLesson(id,hw);if(RUN&&RUN.kind==='lesson'&&!RUN.lessonId)RUN.lessonId=id};

/* XP hooks on the existing trainers */
const wrap=(name,before,after)=>{const f=A[name];if(typeof f!=='function')return;A[name]=function(...a){let x;try{x=before&&before(...a)}catch(e){console.error(e)}const res=f.apply(this,a);try{after&&after(x,...a)}catch(e){console.error(e)}return res}};
wrap('rate',()=>{if(isStudent()){daily().cards++;award(2,'vocab')}});
wrap('endReview',null,()=>{checkDaily();save()});
wrap('checkSpell',()=>{const sp=UI.sp;const c=sp&&S.vocab.find(x=>x.id===sp.id);const el=$('#spin');if(c&&el&&!sp.res&&norm(el.value)===norm(c.word))award(3,'vocab')});
wrap('mR',id=>{const mg=UI.mg;if(mg&&mg.sel&&mg.sel===id)award(2,'vocab')});
wrap('mpPick',w=>{if(UI.mp&&!UI.mp.ans&&w===UI.mp.word)award(3,'pron')});
wrap('stress',(i,j)=>{if((!UI.stress||UI.stress[i]==null)&&STRESS[i]&&j===STRESS[i][2])award(3,'pron')});
wrap('shadowStop',()=>award(5,'pron','Shadowing'));
wrap('checkDict',()=>{const el=$('#dictin');if(!el)return;const tw=norm(DICTATION[UI.dict]).split(' '),gw=norm(el.value).split(' ');const ok=tw.filter((w,i)=>w===gw[i]).length;if(ok)award(2*ok,'listening','Dictation')});
wrap('sendWriting',()=>S.subs.length,n=>{if(S.subs.length>n)award(40,'writing','Text sent to the teacher')});

/* ---------- 6. Diagnostics, bosses, sprint actions ---------- */
A.gScan=n=>{const ls=lessonsOf(n);const qs=pickRR(ls.map(l=>l.grammar),6);if(!qs.length)return toast('No questions for this File');
 listRun({title:`Audit scan · File ${n}`,mode:'test',kind:'scan',back:'/program',showAnswers:true,onFinish:r=>{const c=r.answers.filter(a=>a.ok).length,t=r.answers.length;
  S.program.scan[n]={c,t,date:new Date().toISOString()};if(t&&c/t>=0.8)markLessons(ls.filter(l=>!S.program.debts.includes(l.id)),c/t)}},qs)};
A.gBoss=n=>{const ls=lessonsOf(n);const qs=pickRR(ls.map(l=>l.grammar),10);if(!qs.length)return toast('No questions for this File');
 listRun({title:`Boss · File ${n}`,mode:'test',kind:'boss',timeLimit:480,back:'/program',showAnswers:true,onFinish:r=>{const pct=runScore(r);const B=S.program.bosses;const prev=B[n]||{best:0,won:false,tries:0};const first=!prev.won&&pct>=0.8;
  B[n]={best:Math.max(prev.best||0,pct),won:prev.won||pct>=0.8,tries:(prev.tries||0)+1,date:new Date().toISOString()};
  if(first){markLessons(ls,pct);award(150,'grammar',`Boss File ${n} defeated`);setTimeout(()=>toast(`⚔️ Boss File ${n} defeated! +150 XP`),500)}
  else if(pct<0.8)setTimeout(()=>toast('The boss survived (need 80%). Review the lessons and try again.'),500)}},qs)};
A.gAuditBoss=()=>{const mods=S.program.debts.map(id=>findLesson(id)).filter(Boolean).map(l=>l.grammar);const qs=pickRR(mods,12);
 listRun({title:'Boss · Grand Audit',mode:'test',kind:'boss',timeLimit:600,back:'/program',showAnswers:true,onFinish:r=>{const pct=runScore(r);const P=S.program;const prev=P.auditBoss||{best:0,won:false,tries:0};const first=!prev.won&&pct>=0.8;
  P.auditBoss={best:Math.max(prev.best||0,pct),won:prev.won||pct>=0.8,tries:(prev.tries||0)+1,date:new Date().toISOString()};
  if(first){P.debts.forEach(id=>{if(!P.debtsDone[id])P.debtsDone[id]=new Date().toISOString()});award(200,'grammar','Boss Grand Audit defeated');setTimeout(()=>toast('🧾 Grand Audit closed! +200 XP'),500)}
  else if(pct<0.8)setTimeout(()=>toast('The Grand Audit boss survived (need 80%).'),500)}},qs)};
A.gStage=k=>{const rec=sprintRec();const L=findLesson(rec.lesson);if(!L)return toast('Choose a lesson for today\'s sprint');const g=GRAMMAR[L.grammar];
 if(k==='audit'){const mis=shuffle(S.mistakes.map(m=>ALLQ[m.qid]).filter(Boolean)).slice(0,4);const prev=prevLesson(L);
  const pool=shuffle([...(prev&&GRAMMAR[prev.grammar]?GRAMMAR[prev.grammar].qs:[]),...(g?g.qs:[])]).filter(q=>!mis.includes(q));
  listRun({title:'Dynamic Audit · '+L.code,kind:'sprint',sprintStage:'audit',back:'/sprint',clearMistakes:true},mis.concat(pool).slice(0,6))}
 else if(k==='drills'){if(!g)return toast('No grammar module for this lesson');
  listRun({title:`Heavy Drills · ${L.code} ${L.title}`,kind:'lesson',back:'/sprint',sprintStage:'drills',lessonId:L.id,reshuffle:true,onFinish:r=>{const sc=runScore(r);const p=S.lessonProgress[L.id]||{best:0,done:false};p.best=Math.max(p.best,sc);p.done=p.done||sc>=0.6;S.lessonProgress[L.id]=p}},shuffle(g.qs))}
 else if(k==='skill'){const lv=latestLevel();const hi=!!(lv&&lv.overall>=2.5);const listen=new Date().getDay()===3;const f=L.file?L.file.n:1;
  const key=listen?(hi?'l3':f<=6?'l1':'l2'):(hi?'r3':f<=6?'r1':'r2');if(listen)A.startListening(key);else A.startReading(key);if(RUN){RUN.sprintStage='skill';RUN.back='/sprint'}}
 else if(k==='teardown'){UI.gRule=true;render()}};
A.gTeardown=()=>{const rec=sprintRec();if(!rec.stages.teardown){rec.stages.teardown=true;award(20,'grammar','Sprint stage: Grammar Teardown');sprintCheck(rec)}UI.gRule=false;save();render()};
A.gSprintLesson=id=>{const rec=sprintRec();rec.lesson=id;UI.gRule=false;save();render()};
let blvT;A.gBlvInput=el=>{const rec=sprintRec();rec.text=el.value;const c=$('#blvc');if(c)c.textContent=wc(el.value)+' words · target 80–120';clearTimeout(blvT);blvT=setTimeout(save,700)};
A.gBlvCheck=()=>{const rec=sprintRec();const res=basicCheck(rec.text||'',{min:80,max:120});const el=$('#blvchk');if(el)el.innerHTML=`<div class="card" style="background:var(--surface2)">${res.length?res.map(x=>`<div class="small">• <b>${esc(x[0])}</b>: ${esc(x[1])}</div>`).join(''):'<div class="small">No obvious problems found 👍</div>'}</div>`};
A.gBossLevel=()=>{const rec=sprintRec();const L=findLesson(rec.lesson);const t=(rec.text||'').trim();if(wc(t)<60)return toast('Write at least 60 words (target 80–120)');
 const send=$('#blvsend')&&$('#blvsend').checked;
 if(send){const prompt='Sprint Boss Level · '+(L?L.code+' '+L.title:'')+': '+(BOSS_PROMPTS[L&&L.grammar]||BOSS_PROMPTS.default);const id='w-'+uid();
  S.subs.push({id,type:'writing',taskId:'sprint-boss',prompt,text:t,pre:basicCheck(t,{min:80,max:120}),status:'submitted',date:new Date().toISOString()});
  notify('teacher',`New writing submission from ${S.users.student.name}`,'/t/review/'+id);award(40,'writing','Text sent to the teacher');rec.sent=true}
 if(!rec.stages.boss){rec.stages.boss=true;award(20,'writing','Sprint stage: Boss Level')}
 sprintCheck(rec);logMinutes(8);save();render()};

/* ---------- 7. Pages ---------- */
function skillBars(obj){obj=obj||S.game.week[wk()]||{};const max=Math.max(60,...SKILLS.map(s=>obj[s[0]]||0));
 return SKILLS.map(s=>{const v=obj[s[0]]||0;return `<div class="skrow"><span>${s[2]} ${s[1]}</span><div class="bar"><i style="width:${v/max*100}%;background:${v?'var(--accent)':'var(--surface2)'}"></i></div><span class="small muted" style="text-align:right">${v} XP</span></div>`}).join('')}
function scanBadge(n){const s=S.program.scan[n];if(!s)return '<span class="badge">not scanned</span>';const p=s.t?Math.round(s.c/s.t*100):0;
 return p>=80?`<span class="badge ok">${p}% · confirmed</span>`:p>=50?`<span class="badge warn">${p}% · fast track</span>`:`<span class="badge bad">${p}% · full</span>`}
function xpLog(n){const L=S.game.log.slice(0,n);return L.length?L.map(x=>`<div class="list-item"><div><div>${esc(x.why)}</div><div class="small muted">${fmtDT(x.d)}</div></div><b style="color:var(--ok)">+${x.xp}</b></div>`).join(''):'<div class="empty">No XP yet — start with the daily quests.</div>'}

function vToday(){ensure();const g=S.game,r=rankOf(g.xp),st=calcStreak(),d=daily(),ns=nextStep(),qs=quests(d);
 const day=new Date().getDay(),sday=[1,3,5].includes(day);const rec=sprintRec(false);const L=rec?findLesson(rec.lesson):sprintLesson();
 const pct=r.next?(g.xp-r.min)/(r.next[0]-r.min):1;const started=rec&&Object.keys(rec.stages).length;
 return `<div class="page-head"><h1>Today ⚡</h1><p class="muted">${new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})} · ${sday?'Sprint day: daily block + 45-min sprint':'Daily block · 15 min'} ${ru(sday?'Сегодня день спринта: ежедневный блок 15 минут + спринт 45 минут по уроку English File.':'Сегодня — ежедневный блок 15 минут. Спринт — по желанию.')}</p></div>
 <div class="grid g3" style="margin-bottom:16px">
  <div class="card"><div class="muted small">Rank</div><div class="kpi" style="font-size:22px">🎖️ ${esc(r.name)}</div><div class="bar" style="margin:10px 0 4px"><i style="width:${Math.round(pct*100)}%"></i></div><div class="small muted">${g.xp} XP${r.next?` · ${r.next[0]-g.xp} XP to ${esc(r.next[1])}`:' · top rank'}</div></div>
  <div class="card"><div class="muted small">Streak</div><div class="kpi">🔥 ${st} <small>day${st===1?'':'s'}</small></div><div class="small" style="margin-top:8px">🛡️ Shields: <b>${g.shields}</b> / 2 ${ru('Щит выдаётся за каждые 7 дней подряд. Если день пропущен, сгорает щит, а не стрик.')}</div></div>
  <div class="card"><div class="muted small">Next step · ${PHASES[ns.phase]}</div><div style="font-weight:700;margin:6px 0">${esc(ns.label)}</div><div class="small muted">${esc(ns.hint)}</div><div class="row" style="margin-top:10px"><button class="btn sm" onclick="${ns.js}">Go →</button><a class="btn sm ghost" href="#/program">Program</a></div></div>
 </div>
 <div class="grid g2">
  <div class="card"><div class="row between"><h2>Daily quests · 15 min</h2>${d.bonus?'<span class="badge ok">bonus earned ✓</span>':`<span class="badge acc">+${30+Math.min(50,5*st)} XP bonus</span>`}</div>
   ${qs.map(q=>`<div class="list-item"><div><div>${q.done?'✅':'⬜'} <b>${esc(q.title)}</b></div><div class="small muted">${esc(q.sub)}</div></div>${q.done?'<span class="badge ok">done</span>':`<button class="btn sm" onclick="${q.js}">Start</button>`}</div>`).join('')}</div>
  <div class="card stack"><div class="row between"><h2>Sprint · 45 min</h2>${rec&&rec.done?'<span class="badge ok">done ✓</span>':sday?'<span class="badge warn">today</span>':'<span class="badge">optional</span>'}</div>
   <div><b>${L?esc(L.code+' · '+L.title):'—'}</b>${L&&S.program.debts.includes(L.id)&&!S.program.debtsDone[L.id]?' <span class="badge bad">Grand Audit</span>':''}</div>
   <div class="row">${STAGES.map(s=>`<span class="badge ${rec&&rec.stages[s[0]]?'ok':''}">${rec&&rec.stages[s[0]]?'✓ ':''}${s[1]}</span>`).join('')}</div>
   <div><a class="btn" href="#/sprint">${started?'Continue sprint':'Open sprint'}</a></div></div>
  <div class="card"><h2>Skill balance · this week</h2>${skillBars()}<p class="small muted" style="margin-top:8px">Speaking is trained in live lessons with your teacher. ${ru('Говорение — на уроках с преподавателем, на сайте его нет в балансе.')}</p></div>
  <div class="card"><div class="row between"><h2>Recent XP</h2><a class="small" href="#/achievements">All →</a></div>${xpLog(6)}</div>
 </div>`}

function vProgram(){ensure();const P=S.program,ns=nextStep(),pi=piBook(),lp=lastPlacement();const scanned=Object.keys(P.scan).length;
 const steps=`<div class="row" style="gap:8px;margin-bottom:16px;align-items:stretch">${PHASES.map((p,i)=>`<div class="pstep ${i<ns.phase?'done':i===ns.phase?'cur':''}"><b>${i<ns.phase?'✓':i}</b>${p}</div>`).join('')}</div>`;
 const next=`<div class="card" style="margin-bottom:16px;border-color:var(--accent)"><div class="row between"><div><div class="muted small">Next step</div><div style="font-size:18px;font-weight:700">${esc(ns.label)}</div><div class="small muted">${esc(ns.hint)}</div></div><button class="btn lg" onclick="${ns.js}">Go →</button></div></div>`;
 const p0=`<div class="card stack" style="margin-bottom:16px"><div class="row between"><h2>Phase 0 · Diagnostics</h2><span class="small muted">${scanned}/12 Files scanned</span></div>
  <div class="list-item"><div>🎯 Placement test ${lp?`<span class="badge ok">${cefr(lp.overall)}</span> <span class="small muted">${fmtD(lp.date)}</span>`:'<span class="badge">not taken</span>'}</div><a class="btn sm ${lp?'plain':''}" href="#/placement">${lp?'Results':'Start'}</a></div>
  <div class="list-item"><div>✍️ Placement writing <span class="small muted">· graded by your teacher</span></div><button class="btn sm plain" onclick="A.openWriting('w-placement')">Open</button></div>
  <div><b>Audit scan</b> <span class="small muted">· 6 questions per File: 80%+ confirms it, 50–79% = fast track, below 50% = full lessons.</span> ${ru('Скан показывает, какие Files уже твои. Подтверждённые уроки отмечаются пройденными, кроме долгов Grand Audit.')}</div>
  <div class="scan">${Array.from({length:12},(_,i)=>{const n=i+1;return `<div class="cell"><div class="row between"><b>File ${n}</b></div><div style="margin:6px 0">${scanBadge(n)}</div><button class="btn sm ${P.scan[n]?'plain':''}" onclick="A.gScan(${n})">${P.scan[n]?'Rescan':'Scan'}</button></div>`}).join('')}</div></div>`;
 const ab=P.auditBoss;const allDebts=P.debts.every(id=>P.debtsDone[id]);
 const p1=`<div class="card stack" style="margin-bottom:16px"><div class="row between"><h2>Phase 1 · Grand Audit</h2><span class="small muted">${P.debts.filter(id=>P.debtsDone[id]).length}/${P.debts.length} debts closed</span></div>
  <p class="small muted">Known debts go first. A debt closes with 80%+ in Heavy Drills (or by beating the Grand Audit boss). ${ru('Долги закрываются результатом 80%+ в Heavy Drills на спринте по этому уроку.')}</p>
  ${P.debts.map(id=>{const l=findLesson(id);if(!l)return '';const p=S.lessonProgress[id];return `<div class="list-item"><div>${P.debtsDone[id]?'✅':'🔴'} <b>${esc(l.code)}</b> ${esc(l.title)} <span class="small muted">· ${esc(topicName(l.grammar))}${p?' · best '+Math.round(p.best*100)+'%':''}</span></div><div class="row"><a class="btn sm plain" href="#/grammar/${l.grammar}">Rule</a><button class="btn sm ${P.debtsDone[id]?'plain':''}" onclick="A.gSprintLesson('${id}');go('/sprint')">Sprint</button></div></div>`}).join('')}
  <div class="list-item"><div>⚔️ <b>Boss · Grand Audit</b> <span class="small muted">· 12 questions, 10 min${ab?` · best ${Math.round(ab.best*100)}%`:''}</span> ${ab&&ab.won?'<span class="badge ok">defeated</span>':''}</div><button class="btn sm ${ab&&ab.won?'plain':''}" onclick="A.gAuditBoss()">${allDebts||ab?'Fight':'Fight early'}</button></div></div>`;
 const p2=pi?`<div class="card" style="margin-bottom:16px"><div class="row between"><h2>Phase 2 · Course: Files 1–12</h2><span class="small muted">${bossesWon()}/12 bosses defeated</span></div>
  <p class="small muted">One File a week: lessons A, B, C in the Mon/Wed/Fri sprints, then the boss (10 questions, 8 min, 80% to win). Page numbers are approximate — check them against your book. ${ru('Номера страниц примерные: PDF учебника — скан, сверь с оглавлением.')}</p>
  <div class="files">${pi.files.map(f=>{const b=P.bosses[f.n];return `<div class="card" style="background:var(--surface2)"><div class="row between"><b>File ${f.n}</b>${scanBadge(f.n)}</div><div class="small muted">${esc(f.title)}</div>
   ${f.lessons.map(l=>`<a class="lesson" href="#/lesson/${l.id}"><span class="st ${lessonStatus(l.id)}"></span><b>${esc(l.code)}</b> ${esc(l.title)}${P.debts.includes(l.id)&&!P.debtsDone[l.id]?' <span class="badge bad">debt</span>':''}</a>`).join('')}
   <div class="row between" style="margin-top:10px"><span class="small">${b?(b.won?'⚔️ <b style="color:var(--ok)">defeated</b>':'⚔️ best '+Math.round(b.best*100)+'%'):'<span class="muted">boss not fought</span>'}</span><button class="btn sm ${b&&b.won?'plain':''}" onclick="A.gBoss(${f.n})">Boss</button></div></div>`}).join('')}</div></div>`:'';
 const p3=`<div class="card stack"><h2>Phase 3 · Final check</h2><p class="small">Mid-December: retake the placement test and compare with your first result. Target: B1+ in Grammar, Reading and Listening. ${ru('В середине декабря — повторный placement test. Если кнопка заблокирована, попроси преподавателя разрешить пересдачу.')}</p><div><a class="btn sm plain" href="#/placement">Placement test</a> <a class="btn sm plain" href="#/progress">Progress</a></div></div>`;
 return `<div class="page-head"><h1>My program 🧭</h1><p class="muted">Diagnostics → Grand Audit → English File Pre-intermediate → final check. ${ru('Маршрут по методике: сначала проверка знаний, потом долги, потом курс по порядку.')}</p></div>${steps}${next}${p0}${p1}${p2}${p3}`}

function vSprint(){ensure();const rec=sprintRec();let L=findLesson(rec.lesson);if(!L){const s=sprintLesson();rec.lesson=s?s.id:'';L=s}
 if(!L)return '<div class="card empty">No lessons in the course map.</div>';
 const g=GRAMMAR[L.grammar];const started=Object.keys(rec.stages).length>0;const debt=S.program.debts.includes(L.id)&&!S.program.debtsDone[L.id];
 const cur=STAGES.findIndex(s=>!rec.stages[s[0]]);const prompt=BOSS_PROMPTS[L.grammar]||BOSS_PROMPTS.default;const listen=new Date().getDay()===3;
 const cards=STAGES.map((s,i)=>{const done=!!rec.stages[s[0]];let act='',extra='';
  if(s[0]==='audit')act=`<button class="btn sm ${done?'plain':''}" onclick="A.gStage('audit')">${done?'Again':'Start'}</button>`;
  if(s[0]==='teardown'){if(UI.gRule||done)extra=g?`<div class="card" style="margin-top:10px;background:var(--surface2)"><h3>${esc(g.title)} <span class="badge acc">${g.level}</span></h3>${g.en}${ru(esc(g.ru))}<div class="small" style="margin-top:8px">📘 Student's Book ≈ p. ${esc(L.page)} + Grammar Bank · <a href="#/grammar/${L.grammar}">open the full topic</a></div></div>`:'<div class="small muted">No grammar module for this lesson.</div>';
   act=done?'':UI.gRule?`<button class="btn sm" onclick="A.gTeardown()">Got it ✓</button>`:`<button class="btn sm" onclick="A.gStage('teardown')">Open the rule</button>`}
  if(s[0]==='drills')act=`<button class="btn sm ${done?'plain':''}" onclick="A.gStage('drills')">${done?'Again':'Start'}</button>`,extra=`<div class="small muted" style="margin-top:6px">Then: Workbook exercises for ${esc(L.code)}. ${ru('После упражнений на сайте — упражнения Workbook по этому уроку.')}</div>`;
  if(s[0]==='skill')act=`<button class="btn sm ${done?'plain':''}" onclick="A.gStage('skill')">${done?'Again':'Start'} · ${listen?'Listening':'Reading'}</button>`;
  if(s[0]==='boss'){const n=wc(rec.text);extra=`<div class="stack" style="margin-top:10px"><div style="font-weight:600">${esc(prompt)}</div>
   <textarea id="blv" style="min-height:160px" oninput="A.gBlvInput(this)" placeholder="Start writing…">${esc(rec.text||'')}</textarea>
   <div class="row between"><span id="blvc" class="small muted">${n} words · target 80–120</span><button class="btn sm ghost" onclick="A.gBlvCheck()">🔎 Auto pre-check</button></div><div id="blvchk"></div>
   <label class="row small"><input type="checkbox" id="blvsend" ${rec.sent?'disabled':''}> ${rec.sent?'Sent to your teacher ✓':'Also send to my teacher for review (+40 XP)'}</label>
   <div><button class="btn" onclick="A.gBossLevel()">${done?'Save again':'Finish Boss Level'}</button></div></div>`}
  return `<div class="card stage ${done?'done':i===cur?'cur':''}"><div class="row between"><div><b>${i+1}. ${s[1]}</b> <span class="badge">${s[2]} min</span></div>${done?'<span class="badge ok">done ✓</span>':''}</div><div class="small muted" style="margin:4px 0 8px">${s[3]}</div>${act}${extra}</div>`}).join('');
 return `<div class="page-head"><a class="small" href="#/today">← Today</a><h1>Sprint · ${esc(L.code)} ${esc(L.title)} ${debt?'<span class="badge bad">Grand Audit</span>':''}</h1>
  <p class="muted">File ${L.file?L.file.n:''} · ${esc(topicName(L.grammar))} · 45 min · +20 XP per stage, +50 for the whole sprint ${ru('Теорию урока прочитай заранее по Student\'s Book. Этапы идут по порядку, но можно вернуться к любому.')}</p>
  ${started?'':`<label class="f" style="max-width:420px">Lesson for today's sprint<select onchange="A.gSprintLesson(this.value)">${piLessons().map(l=>`<option value="${l.id}" ${l.id===L.id?'selected':''}>${esc(l.code)} · ${esc(l.title)}${S.program.debts.includes(l.id)&&!S.program.debtsDone[l.id]?' (debt)':''}${lessonDoneId(l.id)?' ✓':''}</option>`).join('')}</select></label>`}</div>
  ${rec.done?'<div class="fb ok" style="margin-bottom:12px"><b>🏁 Sprint complete!</b> Great work. Tomorrow: the daily block.</div>':''}
  <div class="stack">${cards}</div>`}

function vAch(){ensure();const g=S.game,r=rankOf(g.xp);
 return `<div class="page-head"><h1>Achievements 🏆</h1><p class="muted">XP is earned only for real work; the big rewards are for bosses — proven knowledge. ${ru('XP — только за реальную работу. Главные награды — за победу над боссами.')}</p></div>
 <div class="grid g2" style="margin-bottom:16px">
  <div class="card"><h2>Ranks</h2><div class="tbl"><table><tr><th>Rank</th><th>XP</th></tr>${RANKS.map((x,i)=>`<tr style="${i===r.i?'background:var(--accent-soft);font-weight:700':''}"><td>${i<=r.i?'🎖️':'🔒'} ${esc(x[1])}</td><td>${x[0].toLocaleString('en-GB')}</td></tr>`).join('')}</table></div><div class="small muted" style="margin-top:8px">You: <b>${g.xp} XP</b> · ${esc(r.name)}</div></div>
  <div class="card"><h2>How to earn XP</h2><div class="tbl"><table>${[['Correct answer','10'],['Fixed mistake from the bank','15'],['Card reviewed','2'],['Daily quests (all 3)','30 + 5 × streak days (max +50)'],['Sprint stage','20 · whole sprint +50'],['Text sent to the teacher','40'],['Grand Audit debt closed','100'],['Boss File defeated','150 · Grand Audit boss 200']].map(x=>`<tr><td>${x[0]}</td><td><b>${x[1]}</b></td></tr>`).join('')}</table></div></div>
 </div>
 <div class="card" style="margin-bottom:16px"><h2>Badges · ${Object.keys(g.badges).length}/${BADGES.length}</h2><div class="grid g4">${BADGES.map(b=>`<div class="card bdg ${g.badges[b[0]]?'':'lock'}"><div class="ico">${b[1]}</div><b class="small">${esc(b[2])}</b><div class="small muted">${g.badges[b[0]]?fmtD(g.badges[b[0]]):'locked'}</div></div>`).join('')}</div></div>
 <div class="grid g2"><div class="card"><h2>XP by skill · all time</h2>${skillBars(g.skillXp)}</div><div class="card"><h2>XP log</h2>${xpLog(30)}</div></div>`}

function gameTeacherCard(){ensure();const g=S.game,P=S.program,r=rankOf(g.xp),w0=wk();const sw=Object.entries(P.sprints).filter(([k,v])=>k>=w0&&v.done).length;
 return `<div class="card" style="margin-top:16px"><h2>🎮 Program & motivation · ${esc(S.users.student.name)}</h2>
  <div class="grid g4" style="margin:10px 0">${[['Rank',`${esc(r.name)}`,`${g.xp} XP`],['Streak',`🔥 ${calcStreak()}`,`🛡️ ${g.shields} shield(s)`],['Sprints this week',`${sw}/3`,`${sprintsDone()} in total`],['Bosses',`${bossesWon()}/12`,P.auditBoss&&P.auditBoss.won?'Grand Audit ✓':`debts closed ${P.debts.filter(id=>P.debtsDone[id]).length}/${P.debts.length}`],['Audit scan',`${Object.keys(P.scan).length}/12`,'Files scanned']].map(k=>`<div><div class="muted small">${k[0]}</div><div style="font-size:20px;font-weight:700">${k[1]}</div><div class="small muted">${k[2]}</div></div>`).join('')}</div>
  <div class="small">Next step: <b>${esc(nextStep().label)}</b></div>
  <div style="margin-top:10px"><div class="muted small">Skill balance this week — plan speaking on the weak topics</div>${skillBars()}</div></div>`}

/* ---------- 8. Wire into the app ---------- */
SV.today=vToday;SV.program=vProgram;SV.sprint=vSprint;SV.achievements=vAch;
TV.dashboard=()=>tDash()+gameTeacherCard();
const di=STUDENT_NAV.findIndex(n=>n&&n[0]==='dashboard');STUDENT_NAV.splice(di<0?0:di,0,['today','Today','⚡'],['program','My program','🧭'],['sprint','Sprint','🏃']);
const pgi=STUDENT_NAV.findIndex(n=>n&&n[0]==='progress');STUDENT_NAV.splice(pgi<0?STUDENT_NAV.length:pgi+1,0,['achievements','Achievements','🏆']);
home=function(){return '/today'};
const _login=A.login;A.login=r=>{_login(r);location.hash='/today'};
const _signIn=A.signIn;A.signIn=async e=>{await _signIn(e);if(S.role==='student'&&location.hash==='#/dashboard')location.hash='/today'};
const _seed=seed;seed=function(){const s=_seed();s.game=newGame();s.program=newProgram();return s};
SHARED_KEYS.push('game','program');
const _pull=Cloud.pull;Cloud.pull=async function(){const r=await _pull.apply(Cloud,arguments);ensure();indexQuestions();return r};

function decorate(){if(!S||!S.role)return;try{ensure();
 if(Cloud.on&&!Cloud.ready&&!Cloud.booted)return;
 const sp=$('header.top .spacer');if(sp&&!$('#xpchip')){sp.insertAdjacentHTML('beforebegin',`<a id="xpchip" class="xpchip" href="#${S.role==='teacher'?'/t/dashboard':'/achievements'}" title="${S.role==='teacher'?esc(S.users.student.name)+' — rank, XP, streak':'Your rank, XP and streak'}"></a>`);chip()}
 if(isStudent()&&(!Cloud.on||Cloud.ready)){shieldsDaily();shieldsEarn()}
 if(isStudent()&&!location.hash.slice(1))location.replace('#/today')}catch(e){console.error(e)}}
const _render=render;
render=function(){if(S&&S.role==='student'&&!location.hash.slice(1))history.replaceState(null,'','#/today');_render();decorate()};
window.addEventListener('hashchange',decorate);

const css=document.createElement('style');css.textContent=`
.xpchip{display:inline-flex;align-items:center;gap:2px;padding:4px 10px;border-radius:20px;background:var(--warn-soft);color:var(--text);font-size:13px;font-weight:600;text-decoration:none;white-space:nowrap}
@media(max-width:860px){.xpchip .full{display:none}}
@media(max-width:560px){header.top{gap:6px;padding:0 10px}header.top>.badge.acc{display:none}.xpchip{padding:4px 8px}}
.pstep{flex:1 1 150px;padding:10px 12px;border-radius:10px;border:1.5px solid var(--border);background:var(--surface);font-size:14px}
.pstep b{display:inline-grid;place-items:center;width:22px;height:22px;border-radius:50%;background:var(--surface2);margin-right:8px;font-size:12px}
.pstep.cur{border-color:var(--accent);background:var(--accent-soft)}.pstep.cur b{background:var(--accent);color:#fff}
.pstep.done{border-color:var(--ok)}.pstep.done b{background:var(--ok);color:#fff}
.stage{border-left:4px solid var(--border)}.stage.done{border-left-color:var(--ok)}.stage.cur{border-left-color:var(--accent)}
.bdg{text-align:center;padding:14px 10px}.bdg .ico{font-size:30px;line-height:1.2}.bdg.lock{opacity:.45;filter:grayscale(1)}
.scan{display:grid;gap:8px;grid-template-columns:repeat(auto-fill,minmax(min(100%,150px),1fr))}
.scan .cell{border:1px solid var(--border);border-radius:10px;padding:10px;background:var(--surface)}
.skrow{display:grid;grid-template-columns:minmax(110px,140px) 1fr 56px;gap:8px;align-items:center;font-size:13px;margin:6px 0}`;
document.head.appendChild(css);

/* several rewards at once: stack toasts instead of overlapping them */
const _toast=toast;toast=function(msg){_toast(msg);const ts=$$('.toast');ts.forEach((t,i)=>{t.style.bottom=(20+(ts.length-1-i)*50)+'px'})};

/* ---------- 9. Start ---------- */
ensure();indexQuestions();
if(Cloud.on&&Cloud.ready){Cloud.pull().then(()=>render()).catch(e=>console.error(e))}
else{if(!Cloud.on)save();render()}
window.TS_PROGRAM={award,nextStep,sprintLesson,rankOf,ensure};
/* learning materials from data/*.json */
const ms=document.createElement('script');ms.src='materials.js';document.body.appendChild(ms);
})();
