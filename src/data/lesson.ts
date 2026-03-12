export interface Word {
  id: string;
  text: string;
  translation?: string;
}

export interface Sentence {
  words: Word[];
}

export interface Lesson {
  title: string;
  source?: string;
  sentences: Sentence[];
  hasVideo?: boolean;
  videoUrl?: string;
}

// Translation map for French words to English
const translationEntries: Array<[string, string]> = [
  ['Des', 'Some'],
  ['chats', 'cats'],
  ['meurent', 'die'],
  ['pour', 'for'],
  ['la', 'the'],
  ['science', 'science'],
  [':', ':'],
  ['STOP', 'STOP'],
  ['ou', 'or'],
  ['encore', 'again'],
  ['?', '?'],
  ['La', 'The'],
  ['vidéo', 'video'],
  ['que', 'that'],
  ['vous', 'you'],
  ['allez', 'are going to'],
  ['visualiser', 'watch'],
  ['est', 'is'],
  ['le', 'the'],
  ['résultat', 'result'],
  ['du', 'of the'],
  ['travail', 'work'],
  ['de', 'of'],
  ['trois', 'three'],
  ['personnes', 'people'],
  ['En', 'As'],
  ['tant', 'much'],
  ['narrateur', 'narrator'],
  ['et', 'and'],
  ['rédacteur', 'writer'],
  ['en', 'in'],
  ['charge', 'charge'],
  ['véracité', 'veracity'],
  ['scientifique', 'scientific'],
  ['contenu', 'content'],
  ["j'ai", "I have"],
  ['travaillé', 'worked'],
  ['plus', 'more'],
  ['70', '70'],
  ['heures', 'hours'],
  ['ce', 'this'],
  ['nouvel', 'new'],
  ['épisode', 'episode'],
  ['De', 'From'],
  ['son', 'his'],
  ['côté', 'side'],
  ['Laura', 'Laura'],
  ['Maugeri', 'Maugeri'],
  ["l'illustration", 'illustration'],
  ["l'animation", 'animation'],
  ['y', 'there'],
  ['a', 'has'],
  ['100', '100'],
  ['Quant', 'As for'],
  ['à', 'to'],
  ['Gwenael', 'Gwenael'],
  ['Grisi', 'Grisi'],
  ['musique', 'music'],
  ['il', 'he'],
  ['passé', 'spent'],
  ['presque', 'almost'],
  ['40', '40'],
  ['Nous', 'We'],
  ['ne', 'not'],
  ['monétisons', 'monetize'],
  ['pas', 'not'],
  ['toutes', 'all'],
  ['nos', 'our'],
  ['vidéos', 'videos'],
  ['Lorsque', 'When'],
  ['nous', 'we'],
  ['le', 'it'],
  ['faisons', 'do'],
  ['revenu', 'revenue'],
  ['publicitaire', 'advertising'],
  ['dépasse', 'exceeds'],
  ['que', 'than'],
  ['rarement', 'rarely'],
  ['200', '200'],
  ['€', '€'],
  ['par', 'per'],
  ['Il', 'It'],
  ['cela', 'that'],
  ['un', 'a'],
  ['an', 'year'],
  ['je', 'I'],
  ['parlais', 'was talking'],
  ['mon', 'my'],
  ['chat', 'cat'],
  ['Albert', 'Albert'],
  ["d'une", "of a"],
  ['étude', 'study'],
  ['inquiétante', 'worrying'],
  ['publiée', 'published'],
  ['dans', 'in'],
  ['revue', 'journal'],
  ['anglophone', 'English-speaking'],
  ['Stroke', 'Stroke'],
  ['Dans', 'In'],
  ['cette', 'this'],
  ['chercheurs', 'researchers'],
  ['annoncent', 'announce'],
  ['avoir', 'to have'],
  ['découvert', 'discovered'],
  ['une', 'a'],
  ['corrélation', 'correlation'],
  ['entre', 'between'],
  ['consommation', 'consumption'],
  ['boissons', 'drinks'],
  ['light', 'light'],
  ['risque', 'risk'],
  ["d'accident", "of accident"],
  ['vasculaire', 'vascular'],
  ['cérébral', 'cerebral'],
  ['Cela', 'That'],
  ['fait', 'made'],
  ['très', 'very'],
  ['peur', 'fear'],
  ['était', 'was'],
  ["d'ailleurs", 'besides'],
  ['prêt', 'ready'],
  ['boire', 'drink'],
  ['soda', 'soda'],
  ['Pourtant', 'However'],
  ['dépit', 'spite'],
  ['certains', 'some'],
  ['titres', 'headlines'],
  ['presse', 'press'],
  ['alarmistes', 'alarmist'],
  ['beaucoup', 'much'],
  ['trop', 'too'],
  ['tôt', 'early'],
  ["s'inquiéter", 'to worry'],
  ['Lorsque', 'When'],
  ['truc', 'thing'],
  ['corrélée', 'correlated'],
  ['problème', 'problem'],
  ['santé', 'health'],
  ['seule', 'only'],
  ['chose', 'thing'],
  ['ça', 'that'],
  ['veut', 'wants'],
  ['dire', 'say'],
  ["c'est", "it's"],
  ['présent', 'present'],
  ['sur', 'on'],
  ['scène', 'scene'],
  ['crime', 'crime'],
  ['Ce', 'This'],
  ['qui', 'which'],
  ["n'est", "is not"],
  ['suffisant', 'sufficient'],
  ['établir', 'establish'],
  ['sa', 'its'],
  ['culpabilité', 'guilt'],
  ['Si', 'If'],
  ['origine', 'origin'],
  ['papier', 'paper'],
  ['publié', 'published'],
  ['souhaitent', 'wish'],
  ['vraiment', 'really'],
  ['savoir', 'know'],
  ['lien', 'link'],
  ['AVC', 'stroke'],
  ['voici', 'here'],
  ["j'ai", "I have"],
  ["l'époque", 'the time'],
  ['suggéré', 'suggested'],
  ['faire', 'do'],
  ['On', 'We'],
  ['rassemble', 'gather'],
  ['large', 'large'],
  ['échantillon', 'sample'],
  ["d'individus", 'of individuals'],
  ["qu'on", "that we"],
  ['sépare', 'separate'],
  ['hasard', 'random'],
  ['deux', 'two'],
  ['groupes', 'groups'],
  ['même', 'same'],
  ['taille', 'size'],
  ['groupe', 'group'],
  ['dessus', 'above'],
  ['interdit', 'forbid'],
  ['à', 'to'],
  ['partir', 'starting'],
  ['maintenant', 'now'],
  ['dessous', 'below'],
  ['force', 'force'],
  ['tout', 'all'],
  ['monde', 'world'],
  ["s'hydrater", 'to hydrate'],
  ['coups', 'shots'],
  ['uniquement', 'only'],
  ['après', 'after'],
  ['quelques', 'some'],
  ['années', 'years'],
  ['constate', 'observe'],
  ["qu'il", "that it"],
  ['ya', 'there'],
  ['eu', 'had'],
  ['bas', 'bottom'],
  ['sera', 'will be'],
  ['clair', 'clear'],
  ['relation', 'relationship'],
  ['cause', 'cause'],
  ['effet', 'effect'],
  ['aura', 'will have'],
  ['été', 'been'],
  ['établie', 'established'],
  ['suspect', 'suspect'],
  ['ira', 'will go'],
  ['prison', 'prison'],
  ['plan', 'plan'],
  ["d'expérience", 'of experiment'],
  ['beaucoup', 'a lot'],
  ['réagir', 'react'],
  ['ceux', 'those'],
  ['regardent', 'watch'],
  ['"Mais', '"But'],
  ['du', 'of the'],
  ['coup', 'shot'],
  ['observe', 'observe'],
  ['déséquilibre', 'imbalance'],
  ['tend', 'tends'],
  ['augmente', 'increases'],
  ["on", "we"],
  ['aura', 'will have'],
  ['moins', 'less'],
  ['tué', 'killed'],
  ["dans", "in"],
  ["l'un", "one"],
  ["des", "of the"],
  ['groupes', 'groups'],
  ['méthode', 'method'],
  ['tu', 'you'],
  ['proposes', 'propose'],
  ['quand', 'when'],
  ['même', 'even'],
  ['limite', 'limit'],
  ['point', 'point'],
  ['vue', 'view'],
  ['éthique', 'ethical'],
  ['vois', 'see'],
  ['demander', 'ask'],
  ['gens', 'people'],
  ['«', '"'],
  ['est-ce', 'is it'],
  ['voulez', 'want'],
  ['bien', 'well'],
  ['passer', 'spend'],
  ['prochaines', 'next'],
  ['boire', 'drink'],
  ['truc', 'thing'],
  ["pour", "for"],
  ["qu'on", "that we"],
  ['confirme', 'confirm'],
  ['dangereux', 'dangerous'],
  ['?»', '?"'],
  ['Éthiquement', 'Ethically'],
  ['peut', 'can'],
  ['demander', 'ask'],
  ['groupe', 'group'],
  ['personnes', 'people'],
  ['soda', 'soda'],
  ['afin', 'in order'],
  ['voir', 'see'],
  ['si', 'if'],
  ['provoque', 'causes'],
  ['AVC', 'stroke'],
  ['Est-ce', 'Is it'],
  ['comme', 'like'],
  ['ça', 'that'],
  ['prouvé', 'proven'],
  ['plutonium', 'plutonium'],
  ['nocif', 'harmful'],
  ['Espèce', 'Species'],
  ['nazi', 'nazi'],
  ['Cette', 'This'],
  ['merde', 'shit'],
  ['mets', 'put'],
  ['pouce', 'thumb'],
  ['rouge', 'red'],
  ['désabonne', 'unsubscribe'],
  ['crois', 'believe'],
  ['êtes', 'are'],
  ['nombreux', 'many'],
  ['avoir', 'to have'],
  ['mis', 'put'],
  ['doigt', 'finger'],
  ['défaut', 'flaw'],
  ['méthode', 'method'],
  ['scientifique', 'scientific'],
  ['Son', 'Its'],
  ['seul', 'only'],
  ['objectif', 'objective'],
  ["c'est", "it's"],
  ['distinguer', 'distinguish'],
  ['vrai', 'true'],
  ['faux', 'false'],
  ['arriver', 'arrive'],
  ['sentiments', 'feelings'],
  ['certains', 'some'],
  ['retrouvent', 'find'],
  ['blessés', 'hurt'],
  ['gens', 'people'],
  ['sont', 'are'],
  ['mis', 'put'],
  ['danger', 'danger'],
  ['bien', 'well'],
  ['tant', 'so much'],
  ['pis', 'worse'],
  ['Doit-on', 'Should we'],
  ['accepter', 'accept'],
  ['Bien', 'Well'],
  ['sûr', 'sure'],
  ['non', 'no'],
  ['presque', 'almost'],
  ['tout', 'all'],
  ['monde', 'world'],
  ["d'accord", 'agreed'],
  ['là-dessus', 'on that'],
  ['scientifiques', 'scientists'],
  ['compris', 'included'],
  ['s', 's'],
  ['inquiétant', 'worrying'],
  ['ni', 'nor'],
  ['mal', 'bad'],
  ['bien', 'good'],
  ["qu'elle", "that it"],
  ['fait', 'does'],
  ["faut", "must"],
  ["l'encadrer", "frame it"],
  ["déraillement", "derailment"],
  ['.', '.'],
  [',', ','],
  ['!', '!'],
  ['?', '?'],
  ['"', '"'],
  ["'", "'"],
  ['«', '"'],
  ['»', '"'],
];

const translations = new Map(translationEntries);

// Helper function to get translation, handling punctuation
function getTranslation(wordText: string): string {
  // Remove punctuation for lookup
  const cleanWord = wordText.replace(/[.,!?;:«»"'()]/g, '');
  const lowerWord = cleanWord.toLowerCase();
  
  // Try exact match first
  if (translations.has(wordText)) {
    return translations.get(wordText)!;
  }
  
  // Try lowercase match
  if (translations.has(lowerWord)) {
    return translations.get(lowerWord)!;
  }
  
  // Try capitalized match
  const capitalized = lowerWord.charAt(0).toUpperCase() + lowerWord.slice(1);
  if (translations.has(capitalized)) {
    return translations.get(capitalized)!;
  }
  
  // If no translation found, return the word itself
  return wordText;
}

const lessonText = `Des chats meurent pour la science : STOP ou encore ?
La vidéo que vous allez visualiser est le résultat du travail de trois personnes.
En tant que narrateur et rédacteur, en charge de la véracité scientifique du contenu, j'ai travaillé plus de 70 heures pour ce nouvel épisode.
De son côté Laura Maugeri, en charge de l'illustration et de l'animation, y a travaillé plus de 100 heures.
Quant à Gwenael Grisi, en charge de la musique, il y a passé presque 40 heures.
Nous ne monétisons pas toutes nos vidéos.
Lorsque nous le faisons, le revenu publicitaire ne dépasse que rarement 200 € par vidéo.
Il y a de cela un an, je parlais à mon chat Albert d'une étude inquiétante, publiée dans la revue anglophone Stroke.
Dans cette étude, les chercheurs annoncent avoir découvert une corrélation entre consommation de boissons light et risque d'accident vasculaire cérébral.
Cela a fait très peur à mon chat, il était d'ailleurs prêt à ne plus boire de soda light.
Pourtant en dépit de certains titres de presse alarmistes, il est beaucoup trop tôt pour s'inquiéter.
Lorsque un truc est corrélée à un problème de santé,
la seule chose que ça veut dire c'est que ce truc est présent sur la scène du crime.
Ce qui n'est pas suffisant pour établir sa culpabilité.
Si les chercheurs à l'origine du papier publié dans Stroke souhaitent vraiment en savoir plus sur le lien entre boissons light et AVC,
voici ce que j'ai, à l'époque, suggéré de faire :
On rassemble un large échantillon d'individus qu'on sépare, au hasard, en deux groupes de même taille.
Dans le groupe du dessus, on interdit la consommation de boissons light à partir de maintenant.
Dans le groupe du dessous, on force tout le monde à s'hydrater à coups de boissons light uniquement.
Si après quelques années, on constate qu'il ya eu plus d'AVC dans le groupe du bas, ce sera clair :
une relation de cause à effet entre consommation de boissons light et risque d'AVC aura été établie.
Le suspect ira en prison.
Ce plan d'expérience a beaucoup fait réagir ceux qui nous regardent.
"Mais du coup, si on observe un déséquilibre
entre les deux groupes qui tend à dire que le light augmente le risque d'AVC,
on aura plus ou moins tué des gens dans l'un des groupes."
"La méthode que tu proposes est quand même limite d'un point de vue éthique.
Tu te vois vraiment demander aux gens « est-ce que vous voulez bien passer les prochaines années à boire un truc
pour qu'on confirme que c'est dangereux ?»"
"Éthiquement, on ne peut pas demander à un groupe de personnes de boire du soda afin de voir si ça provoque des AVC."
Est-ce que c'est comme ça qu'on a prouvé que le plutonium était nocif ?"
"Espèce de nazi. Cette vidéo c'est de la merde, je mets un pouce rouge et je me désabonne."
Je crois que vous êtes nombreux à avoir mis le doigt sur un défaut de la méthode scientifique.
Son seul objectif c'est de distinguer le vrai du faux.
Si pour y arriver les sentiments de certains se retrouvent blessés ou que des gens sont mis en danger, et bien c'est tant pis.
Doit-on l'accepter ? Bien sûr que non, presque tout le monde est d'accord là-dessus, scientifiques compris.
La méthode scientifique ne s'inquiétant ni du mal ni du bien qu'elle fait, il faut l'encadrer pour que ça ne déraille pas.`;

function parseLesson(text: string): Lesson {
  const lines = text.split('\n');
  const title = lines[0].trim();
  const body = lines.slice(1).join(' ');

  // Split body into sentences (simple approach: split on period, exclamation, question mark)
  const sentenceEndings = /([.!?])\s+/g;
  const sentences: Sentence[] = [];
  let wordIdCounter = 0;

  // Split by sentence endings
  const sentenceTexts = body.split(sentenceEndings).filter(s => s.trim().length > 0);
  
  // Group punctuation with previous sentence
  const groupedSentences: string[] = [];
  for (let i = 0; i < sentenceTexts.length; i++) {
    if (sentenceTexts[i].match(/^[.!?]$/)) {
      // This is punctuation, append to previous
      if (groupedSentences.length > 0) {
        groupedSentences[groupedSentences.length - 1] += sentenceTexts[i];
      }
    } else {
      groupedSentences.push(sentenceTexts[i]);
    }
  }

  // Parse each sentence into words
  for (const sentenceText of groupedSentences) {
    const words: Word[] = [];
    // Split by whitespace and punctuation, but keep punctuation attached
    const wordMatches = sentenceText.match(/\S+/g) || [];
    
    for (const wordText of wordMatches) {
      words.push({
        id: `w${wordIdCounter++}`,
        text: wordText,
        translation: getTranslation(wordText)
      });
    }

    if (words.length > 0) {
      sentences.push({ words });
    }
  }

  return {
    title: title,
    sentences: sentences
  };
}

export const lesson: Lesson = {
  ...parseLesson(lessonText),
  source: 'La statistique expliquée à mon chat',
  hasVideo: true,
};
