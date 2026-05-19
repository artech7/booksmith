// ── Adverb alternatives lookup ─────────────────────────────────────────────────
// swap: direct word-for-word replacements (stronger/more precise adverbs)
// verb: verb alternatives that require manual editing of the surrounding phrase
// tip:  usage note shown at top of popup

export const ALTERNATIVES = {
  // ── Intensifiers ─────────────────────────────────────────────────────────────
  'very': {
    tip: 'Cut "very" and strengthen the word it modifies, or swap for a more precise intensifier.',
    swap: ['extremely', 'remarkably', 'exceptionally', 'intensely', 'profoundly', 'deeply', 'wildly', 'acutely'],
    verb: [],
  },
  'really': {
    tip: '"Really" rarely adds meaning. Cut it or replace with a precise intensifier.',
    swap: ['genuinely', 'truly', 'sincerely', 'deeply', 'absolutely', 'profoundly', 'thoroughly'],
    verb: [],
  },
  'quite': {
    tip: '"Quite" is vague. In British English it can mean "somewhat"; in American English, "very".',
    swap: ['fairly', 'rather', 'somewhat', 'moderately', 'considerably', 'noticeably'],
    verb: [],
  },
  'just': {
    tip: 'Often filler. Cut it, or use a more precise qualifier.',
    swap: ['only', 'merely', 'simply', 'precisely', 'exactly'],
    verb: [],
  },
  'actually': {
    tip: 'Usually filler. Cut it unless emphasising contrast.',
    swap: ['in fact', 'in truth', 'genuinely', 'truly', 'indeed'],
    verb: [],
  },
  'basically': {
    tip: 'Informal filler. Cut it or use a more precise qualifier.',
    swap: ['essentially', 'fundamentally', 'at its core', 'in essence', 'at heart', 'chiefly'],
    verb: [],
  },
  'literally': {
    tip: 'Often used as an intensifier when "figuratively" is meant. Use only for actual literal meaning.',
    swap: ['truly', 'genuinely', 'exactly', 'precisely', 'in fact', 'actually'],
    verb: [],
  },
  'totally': {
    tip: 'Informal intensifier. Prefer precise alternatives in prose.',
    swap: ['completely', 'entirely', 'wholly', 'utterly', 'absolutely', 'thoroughly'],
    verb: [],
  },
  'absolutely': {
    swap: ['completely', 'entirely', 'wholly', 'utterly', 'unquestionably', 'undeniably'],
    verb: [],
  },
  'extremely': {
    swap: ['intensely', 'profoundly', 'remarkably', 'exceptionally', 'extraordinarily', 'acutely'],
    verb: [],
  },
  'incredibly': {
    swap: ['remarkably', 'extraordinarily', 'astonishingly', 'breathtakingly', 'staggeringly'],
    verb: [],
  },
  'rather': {
    swap: ['somewhat', 'fairly', 'moderately', 'considerably', 'quite', 'noticeably'],
    verb: [],
  },
  'somewhat': {
    swap: ['slightly', 'moderately', 'partially', 'marginally', 'relatively', 'to some degree'],
    verb: [],
  },
  'fairly': {
    swap: ['reasonably', 'moderately', 'adequately', 'tolerably', 'passably'],
    verb: [],
  },
  'almost': {
    swap: ['nearly', 'practically', 'virtually', 'all but', 'on the verge of'],
    verb: [],
  },
  'nearly': {
    swap: ['almost', 'practically', 'virtually', 'just about', 'all but'],
    verb: [],
  },
  'perhaps': {
    swap: ['maybe', 'possibly', 'conceivably', 'it may be that', 'perchance'],
    verb: [],
  },
  'maybe': {
    swap: ['perhaps', 'possibly', 'conceivably', 'potentially', 'it may be'],
    verb: [],
  },
  'probably': {
    swap: ['likely', 'presumably', 'in all likelihood', 'most likely', 'doubtless', 'seemingly'],
    verb: [],
  },

  // ── Movement adverbs ─────────────────────────────────────────────────────────
  'quickly': {
    swap: ['swiftly', 'rapidly', 'briskly', 'hastily', 'promptly', 'speedily'],
    verb: ['sprinted', 'darted', 'rushed', 'bolted', 'dashed', 'flew', 'hurtled', 'raced'],
  },
  'slowly': {
    swap: ['gradually', 'leisurely', 'languidly', 'deliberately', 'unhurriedly'],
    verb: ['crept', 'trudged', 'inched', 'shuffled', 'plodded', 'meandered', 'dawdled'],
  },
  'suddenly': {
    swap: ['abruptly', 'sharply', 'unexpectedly', 'without warning', 'in an instant'],
    verb: ['lurched', 'snapped', 'jolted', 'startled', 'erupted', 'burst'],
  },
  'quietly': {
    swap: ['silently', 'softly', 'gently', 'mutely', 'noiselessly', 'in a hush'],
    verb: ['whispered', 'murmured', 'breathed', 'tiptoed', 'padded', 'slipped', 'crept'],
  },
  'loudly': {
    swap: ['noisily', 'boisterously', 'thunderously', 'deafeningly', 'at full volume'],
    verb: ['thundered', 'roared', 'bellowed', 'boomed', 'shouted', 'shrieked', 'blared'],
  },
  'angrily': {
    swap: ['furiously', 'hotly', 'fiercely', 'bitterly', 'wrathfully', 'indignantly'],
    verb: ['snarled', 'snapped', 'growled', 'spat', 'fumed', 'raged', 'glared', 'barked'],
  },
  'sadly': {
    swap: ['sorrowfully', 'mournfully', 'despondently', 'dejectedly', 'forlornly', 'woefully'],
    verb: ['wept', 'mourned', 'grieved', 'lamented', 'sighed', 'drooped', 'slumped'],
  },
  'happily': {
    swap: ['joyfully', 'gleefully', 'cheerfully', 'delightedly', 'jubilantly', 'blissfully'],
    verb: ['beamed', 'grinned', 'laughed', 'radiated', 'glowed', 'bounced', 'danced'],
  },
  'nervously': {
    swap: ['anxiously', 'apprehensively', 'uneasily', 'tensely', 'jitterily', 'timidly'],
    verb: ['fidgeted', 'trembled', 'hesitated', 'faltered', 'wavered', 'stuttered'],
  },
  'carefully': {
    swap: ['cautiously', 'deliberately', 'methodically', 'painstakingly', 'meticulously', 'warily'],
    verb: ['eased', 'navigated', 'measured', 'considered', 'examined', 'scrutinised'],
  },
  'harshly': {
    swap: ['sharply', 'bluntly', 'cruelly', 'severely', 'curtly', 'coldly', 'brusquely'],
    verb: ['snapped', 'snarled', 'lashed', 'barked', 'cut', 'stung', 'scalded'],
  },
  'softly': {
    swap: ['gently', 'delicately', 'tenderly', 'lightly', 'faintly'],
    verb: ['whispered', 'murmured', 'breathed', 'caressed', 'drifted', 'brushed'],
  },
  'deeply': {
    swap: ['profoundly', 'intensely', 'acutely', 'thoroughly', 'wholly', 'fully'],
    verb: ['resonated', 'moved', 'struck', 'gripped', 'shook', 'pierced'],
  },
  'clearly': {
    swap: ['plainly', 'evidently', 'obviously', 'unmistakably', 'transparently', 'distinctly'],
    verb: ['showed', 'proved', 'demonstrated', 'revealed', 'illuminated'],
  },
  'simply': {
    swap: ['plainly', 'directly', 'straightforwardly', 'merely', 'only', 'purely', 'just'],
    verb: [],
  },
  'strongly': {
    swap: ['firmly', 'powerfully', 'forcefully', 'intensely', 'vehemently', 'emphatically'],
    verb: ['gripped', 'insisted', 'pressed', 'urged', 'drove', 'pushed', 'compelled'],
  },
  'gently': {
    swap: ['tenderly', 'softly', 'delicately', 'lightly', 'lovingly', 'kindly'],
    verb: ['coaxed', 'eased', 'nudged', 'stroked', 'cradled', 'soothed', 'guided'],
  },
  'bravely': {
    swap: ['courageously', 'boldly', 'fearlessly', 'valiantly', 'gallantly', 'intrepidly'],
    verb: ['faced', 'confronted', 'withstood', 'endured', 'defied', 'charged', 'stood firm'],
  },
  'honestly': {
    swap: ['sincerely', 'frankly', 'candidly', 'straightforwardly', 'bluntly', 'plainly'],
    verb: ['admitted', 'confessed', 'disclosed', 'revealed', 'stated', 'declared'],
  },
  'perfectly': {
    swap: ['flawlessly', 'impeccably', 'immaculately', 'faultlessly', 'precisely', 'exactly'],
    verb: ['nailed', 'mastered', 'executed', 'achieved', 'accomplished'],
  },
  'easily': {
    swap: ['effortlessly', 'readily', 'smoothly', 'fluently', 'naturally', 'instinctively'],
    verb: ['glided', 'breezed', 'sailed', 'coasted', 'navigated', 'managed'],
  },
  'poorly': {
    swap: ['badly', 'inadequately', 'feebly', 'ineptly', 'clumsily', 'sloppily'],
    verb: ['fumbled', 'stumbled', 'struggled', 'faltered', 'bungled', 'botched'],
  },
  'fiercely': {
    swap: ['ferociously', 'savagely', 'furiously', 'intensely', 'aggressively', 'violently'],
    verb: ['raged', 'tore', 'fought', 'blazed', 'railed', 'attacked', 'struck'],
  },
  'tightly': {
    swap: ['firmly', 'rigidly', 'snugly', 'securely', 'closely', 'tensely'],
    verb: ['gripped', 'clutched', 'clenched', 'seized', 'locked', 'clung'],
  },
  'loudly': {
    swap: ['noisily', 'boisterously', 'deafeningly', 'thunderously', 'shrilly'],
    verb: ['roared', 'bellowed', 'thundered', 'blared', 'shrieked', 'boomed'],
  },
  'specifically': {
    swap: ['particularly', 'explicitly', 'precisely', 'exactly', 'notably', 'especially'],
    verb: [],
  },
  'authentically': {
    swap: ['genuinely', 'sincerely', 'truly', 'faithfully', 'honestly'],
    verb: [],
  },
};

// Words that are commonly used as adverbs but not -ly
export const WEAK_ADVERBS = new Set([
  'very', 'really', 'quite', 'just', 'actually', 'basically', 'literally',
  'totally', 'absolutely', 'definitely', 'certainly', 'probably', 'perhaps',
  'maybe', 'almost', 'nearly', 'rather', 'somewhat', 'fairly', 'extremely',
  'incredibly', 'pretty', 'so', 'too', 'enough', 'still', 'already',
]);
