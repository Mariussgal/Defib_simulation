export interface Scenario {
  id: string;
  title: string;
  description: string;
  objectives: string[];
  color: 'red' | 'orange' | 'purple' | 'green';
  icon: string;
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'scenario_1',
    title: 'Scénario 1 - Fibrillation ventriculaire',
    description: 'Vous êtes aux urgences. Un homme de 62 ans, aux antécédents de diabète, hypertension artérielle, est installé dans un box pour douleur thoracique typique depuis 2h. Durant l\'examen le patient est inconscient et ne respire pas. L\'alerte est donnée et le chariot d\'urgence est amené au lit du malade qui présente un arrêt cardio-respiratoire. Le massage cardiaque externe est débuté. Vous devez utiliser le défibrillateur en mode manuel pour délivrer un choc de 150 Joules.',
    objectives: [
      'Connecter les électrodes et vérifier le bon positionnement sur le torse',
      'Allumer le défibrillateur en position moniteur',
      'Lire le rythme et arrêter le massage pour analyser le rythme (FV)',
      'Positionner la molette verte sur 150 joules',
      'Appuyer sur le bouton jaune pour charger',
      'Délivrer le choc en appuyant sur le bouton orange'
    ],
    color: 'red',
    icon: '⚡'
  },
  {
    id: 'scenario_2',
    title: 'Scénario 2 - Défibrillation automatisée externe (DAE)',
    description: 'Vous êtes dans le service de médecine interne. Monsieur A. âgé de 58 ans, aux antécédents d\'hypertension artérielle, dyslipidémie est hospitalisé en chambre 202 pour une embolie pulmonaire. Son voisin alerte l\'infirmière car le patient ne répond pas. L\'infirmière découvre M. A. en arrêt cardio respiratoire et amène le chariot d\'urgence après avoir alerté ses collègues. Vous devez utiliser le défibrillateur en mode DAE pour délivrer un choc de 150 Joules.',
    objectives: [
      'Allumer le défibrillateur en mode DAE',
      'Écouter les instructions',
      'Connecter les électrodes et vérifier le bon positionnement sur le torse',
      'Lire le rythme - « Analyse du rythme en cours »',
      '« Choc recommandé » - Charge automatique par le DAE',
      'Délivrer le choc en appuyant sur le bouton orange'
    ],
    color: 'orange',
    icon: '💓'
  },
  {
    id: 'scenario_3',
    title: 'Scénario 3 - Électro-entraînement',
    description: 'Vous êtes médecin au déchocage aux urgences. Madame G. âgée de 60 ans, aux antécédents de diabète est prise en charge pour une syncope il y a 1h associée à une asthénie. L\'ECG montre un BAV 3 à 30/min. La patiente présente de nouveau un malaise. Vous devez utiliser le défibrillateur pour électro-entraîner la patiente.',
    objectives: [
      'Connecter les électrodes et vérifier le bon positionnement sur le torse',
      'Allumer le défibrillateur en position moniteur',
      'Lire le rythme',
      'Positionner la molette verte sur stimulation',
      'Régler les paramètres de l\'électro-entraînement (intensité et fréquence)',
      'Lancer la séquence de stimulation'
    ],
    color: 'purple',
    icon: '💔'
  },
  {
    id: 'scenario_4',
    title: 'Scénario 4 - Cardioversion',
    description: 'Vous êtes médecin de déchocage aux urgences. Monsieur L. âgé de 80 ans, aux antécédents d\'hypertension et d\'embolie pulmonaire anticoagulée au long cours, est pris en charge pour des palpitations depuis 6h. L\'ECG montre une ACFA à 160/min, le traitement médicamenteux est un échec et le patient présente une syncope associée à une hypertension. Vous utilisez le défibrillateur pour réaliser une cardioversion.',
    objectives: [
      'Connecter les électrodes et vérifier le bon positionnement sur le torse',
      'Allumer le défibrillateur en position moniteur',
      'Lire le rythme',
      'Appuyer sur le bouton synchro',
      'Tourner la molette sur le nombre de Joules',
      'Charger puis choquer'
    ],
    color: 'green',
    icon: '💚'
  },
  {
    id: 'scenario_5',
    title: 'Scénario 5 - Simulation in situ',
    description: 'SMUR',
    objectives: [
      
    ],
    color: 'orange',
    icon: '🚑'
  }
];

export const COLOR_CLASSES = {
  red: 'border-red-500 hover:bg-red-900/20',
  orange: 'border-orange-500 hover:bg-orange-900/20',
  purple: 'border-purple-500 hover:bg-purple-900/20',
  green: 'border-green-500 hover:bg-green-900/20'
};

