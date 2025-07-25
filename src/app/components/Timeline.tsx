import React from 'react';
import { Check, Circle } from 'lucide-react';
import Card from './ui/Card';
import Badge from './ui/Badge';

interface TimelineStep {
  id: number;
  title: string;
  description: string | string[];
  status: 'completed' | 'current' | 'upcoming';
  date?: string;
}

interface TimelineProps {
  steps?: TimelineStep[];
  orientation?: 'vertical' | 'horizontal';
}

const Timeline: React.FC<TimelineProps> = ({ 
  steps = [
    {
      id: 1,
      title: "Planification du projet",
      description: "Scope, besoins médicaux et choix technos définis pour le simulateur",
      status: "completed",
     
    },
    {
      id: 2,
      title: "Développement du simulateur interactif",
      description: "Implémentation des fonctionnalités clés du simulateur et des scénarios interactifs",
      status: "completed",
    
    },
    {
      id: 3,
      title: "Intégration en conditions réelles de simulation",
      description: [
        "Connexion à un mannequin générant ou non le signal en temps réel",
        "Scénario double défibrillation",
        "Ouverture à une plateforme de simulation globale avec d'autres outils : lecteur glycémie, HemoCue, appareil ECG, respirateur..."
      ],
      status: "upcoming",

    }
  ],
  orientation = 'vertical'
}) => {
  const getStepIcon = (status: string, index: number) => {
    switch (status) {
      case 'completed':
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full">
            <Check className="w-4 h-4" />
          </div>
        );
      case 'current':
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full">
            <span className="text-sm font-medium">{index + 1}</span>
          </div>
        );
      case 'upcoming':
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-muted border-2 border-border rounded-full">
            <Circle className="w-4 h-4 text-muted-foreground" />
          </div>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      current: 'secondary',
      upcoming: 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants]} className="text-xs">
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (orientation === 'horizontal') {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="flex items-start justify-between relative">
          {/* Connection line */}
          <div className="absolute top-4 left-4 right-4 h-0.5 bg-border z-0">
            <div 
              className="h-full bg-primary transition-all duration-500"
              style={{ 
                width: `${((steps.filter(s => s.status === 'completed').length) / (steps.length - 1)) * 100}%` 
              }}
            />
          </div>

          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center flex-1 relative z-10">
              {getStepIcon(step.status, index)}
              
              <Card className="mt-4 p-4 w-full max-w-xs">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-foreground">{step.title}</h3>
                    {getStatusBadge(step.status)}
                  </div>
                  {step.id === 3 && Array.isArray(step.description) ? (
                    <ul className="text-xs text-muted-foreground leading-relaxed list-disc list-inside">
                      {step.description.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  )}
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6 mt-25 mb-15">
      <div className="relative">
        <h2 className="text-3xl font-bold text-white text-center mb-15">What's Next ?</h2>
        {/* Vertical connection line */}
        <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-border">
          <div 
            className="w-full bg-primary transition-all duration-500"
            style={{ 
              height: `${((steps.filter(s => s.status === 'completed').length) / steps.length) * 100}%` 
            }}
          />
        </div>

        <div className="space-y-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-start space-x-4 relative">
              <div className="relative z-10">
                {getStepIcon(step.status, index)}
              </div>
              
              <Card className="flex-1 p-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg text-foreground mb-5">{step.title}</h3>
                    {getStatusBadge(step.status)}
                  </div>
                  {step.id === 3 && Array.isArray(step.description) ? (
                    <ul className="text-muted-foreground leading-relaxed list-disc pl-4 space-y-3">
                      {step.description.map((item, idx) => {
                        // Mise en gras des mots-clés principaux
                        let formatted = item
                          .replace(/^Connexion à un mannequin/, '<b>Connexion à un mannequin</b>')
                          .replace(/^Scénario double défibrillation/, '<b>Scénario double défibrillation</b>')
                          .replace(/^Ouverture à une plateforme/, '<b>Ouverture à une plateforme</b>');
                        return (
                          <li key={idx} className="pl-0" style={{marginLeft: 0}}>
                            <span dangerouslySetInnerHTML={{ __html: formatted }} />
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  )}
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Timeline; 