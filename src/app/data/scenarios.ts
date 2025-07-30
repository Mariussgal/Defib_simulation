export interface Scenario {
  id: string;
  title: string;
  description: string;
  objectives: string[];
  color: "red" | "orange" | "purple" | "green";
  icon: string;
}

export const SCENARIOS: Scenario[] = [
  {
    id: "scenario_1",
    title: "Scénario 1 - ACR défibrillation en mode manuel ",
    description:
      "Un homme de 62 ans hypertendu amené aux urgences par la BSPP est installé dans un box pour douleur thoracique apparue depuis 2h. Lorsque vous venez l’examiner, le patient est inconscient et ne respire pas, sans témoins du début de l’arrêt cardio pulmonaire. L'alerte est donnée et le chariot d'urgence est amené au lit du malade. La réanimation cardio pulmonaire est débutée et vous posez les électrodes de défibrillation sur le torse du patient. Vous devez utiliser le défibrillateur en mode manuel pour délivrer un choc de 150 Joules.",
    objectives: [
      "Connecter les électrodes et vérifier le bon positionnement sur le torse",
      "Allumer le défibrillateur en position moniteur",
      "Lire le rythme et arrêter le massage pour analyser le rythme (FV)",
      "Positionner la molette verte sur 150 joules",
      "Appuyer sur le bouton jaune pour charger",
      "Délivrer le choc en appuyant sur le bouton orange",
    ],
    color: "red",
    icon: "⚡",
  },
  {
    id: "scenario_2",
    title: "Scénario 2 - ACR défibrillation en mode DAE ",
    description:
      "Un homme âgé de 58 ans est hospitalisé chambre 2 aux UHCD pour une embolie pulmonaire. Lors de son tour de nuit, l'infirmière le découvre en arrêt cardio respiratoire et amène le chariot d'urgence après avoir donné l’alerte. Vous devez utiliser le défibrillateur en mode DAE pour mener à bien la réanimation cardio pulmonaire. ",
    objectives: [
      "Allumer le défibrillateur en mode DAE",
      "Connecter le connecteur et brancher les électrodes sur la poitrine du patient",
      "Délivrer le choc en appuyant sur le bouton orange",
    ],
    color: "orange",
    icon: "💓",
  },
  {
    id: "scenario_3",
    title: "Scénario 3 - Entraînement électrosystolique",
    description:
      "Une femme âgée de 60 ans se présentant aux urgences est prise en charge au déchocage pour une syncope. L'ECG montre un BAV III à 30 bpm. Malgré un traitement médicamenteux initial, la patiente présente une perte de connaissance brutale associée à une hypotension artérielle et des marbrures. Vous décidez de réaliser un entraînement électro systolique à l’aide du défibrillateur. Vous placez les électrodes à 3 brins ainsi que les électrodes de défibrillation sur la poitrine de la patiente. Vous devez utiliser le défibrillateur en mode sentinelle pour délivrer un courant à la fréquence de 60 bpm avec une intensité croissante à partir de 10mA jusqu’à obtenir une capture. ",
    objectives: [
      "Positionner la molette verte sur stimulation",
      "Choisir le mode sentinelle",
      "Régler la fréquence de l'électro-entraînement à 60/min",
      "Démarrer la stimulation",
      "Régler l'intensité de l'électro-entraînement progressivement de manière a obtenir une capture du signal ECG (de 10mA en 10mA à partir de 10mA). La capture sera obtenue à partir de 90 mA",
      "Lancer la séquence de stimulation en mode fixe",
    ],
    color: "purple",
    icon: "💔",
  },
  {
    id: "scenario_4",
    title: "Scénario 4 - Cardioversion",
    description:
      "« Un homme âgé de 80 ans, aux antécédents d'hypertension et d'embolie pulmonaire anticoagulée au long cours, est pris en charge aux urgences pour des palpitations depuis 6h. L'ECG montre une ACFA à 160 bpm, le traitement médicamenteux est un échec et le patient présente une syncope associée à une hypotension artérielle. Vous placez les électrodes de défibrillation sur la poitrine du patient et vous devez utiliser le défibrillateur pour réaliser une cardioversion électrique a 150 joules.",
    objectives: [
      "Allumer le défibrillateur",
      "Positionnez la molette sur 150 Joules",
      "Appuyer sur le bouton synchro",
      "Appuyer sur le bouton jaune pour charger",
      "Délivrer le choc en appuyant sur le bouton orange",
    ],
    color: 'green',
    icon: '💚'
  },
  {
    id: 'scenario_5',
    title: 'Scénario 5 - Simulation in situ',
    description: 'Ce scénario peut être réalisé avec votre équipe de simulation. Vous prenez en charge un patient retrouvé en arrêt cardio circulatoire. Vous devez utiliser le défibrillateur pour mener à bien la RCP.  \n\n N.B. : L’application n’étant pas connectée à votre mannequin, vous devez cliquer sur l’encart de la FC après avoir posé vos électrodes de défibrillation pour révéler le rythme, vous ne verrez pas l’activité électrique de votre massage cardiaque lors de la RCP.',
    objectives: [
      
    ],
    color: 'orange',
    icon: '🚑'
  }
];

export const COLOR_CLASSES = {
  red: "border-red-500 hover:bg-red-900/20",
  orange: "border-orange-500 hover:bg-orange-900/20",
  purple: "border-purple-500 hover:bg-purple-900/20",
  green: "border-green-500 hover:bg-green-900/20",
};
