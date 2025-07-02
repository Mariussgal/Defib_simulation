"use client";

import Link from "next/link";
import { ArrowRight, Shield, Users, Activity, ChevronDown } from "lucide-react";
import Particles from "./components/Particles";
import ChromaGrid from "./components/ChromaGrid";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 relative pb-40">
      {/* Background Particles */}
      <div className="fixed inset-0 z-0">
        <Particles
          particleColors={['#3b82f6', '#1d4ed8', '#ffffff']}
          particleCount={170}
          particleSpread={15}
          speed={0.05}
          particleBaseSize={100}
          moveParticlesOnHover={true}
          particleHoverFactor={0.5}
          alphaParticles={true}
          disableRotation={false}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center align-center justify-center p-6 backdrop-blur-sm">
        <div className=" md:flex space-x-8 text-sm">
          <a href="#features" className="text-gray-400 hover:text-white transition-colors">Fonctionnalités</a>
          <a href="#scenarios" className="text-gray-400 hover:text-white transition-colors">Scénarios</a>
          <a href="#about" className="text-gray-400 hover:text-white transition-colors">À propos</a>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[85vh] text-center px-6">
        <div className="max-w-4xl mx-auto">
            <span className=" mb-8 block text-white text-5xl md:text-7xl font-light mt-2 leading-tight font-bold">
              Plateforme de Formation aux techniques de défibrillation
            </span>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
  
            Formez-vous en sécurité, répondez avec confiance.
          </p>

          {/* CTA Button */}
          <Link href="/simulator">
            <button className="group inline-flex items-center justify-center px-8 py-4 bg-white text-gray-950 font-semibold rounded-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105">
              <span className="mr-2">Commencer la Formation</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
          </Link>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <ChevronDown className="w-6 h-6 text-gray-500" />
          </div>
        </div>
      </div>


      {/* Stats Section */}
      <section className="relative z-10 py-16 px-6 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-white mb-2">4+</div>
              <div className="text-gray-500 text-sm">Scénarios de Formation</div>

            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">100%</div>
              <div className="text-gray-500 text-sm">Apprentissage Sécurisé</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">24/7</div>
              <div className="text-gray-500 text-sm">Accès</div>
            </div>

            <div>
              <div className="text-3xl font-bold text-white mb-2">Gratuit</div>
              <div className="text-gray-500 text-sm">Sans Limitation</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Fonctionnalités Professionnelles
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Technologie de simulation avancée conçue pour les professionnels de santé
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-10 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 hover:border-gray-700 transition-colors flex flex-col items-center justify-center">
              <h3 className="text-xl font-semibold text-white mb-3 text-center">ECG Réaliste</h3>
              <p className="text-gray-400 text-sm text-center">
                Rythmes cardiaques authentiques incluant sinusal, FV, asystolie avec modification en temps réel.
              </p>
          </div>

            <div className="p-10 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 hover:border-gray-700 transition-colors flex flex-col items-center justify-center">
              <h3 className="text-xl font-semibold text-white mb-3 text-center">Modes Multiples</h3>
              <p className="text-gray-400 text-sm text-center">
                Modes DAE, Manuel, Moniteur et Stimulateur.
              </p>
            </div>

            <div className="p-10 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 hover:border-gray-700 transition-colors flex flex-col items-center justify-center">
              <h3 className="text-xl font-semibold text-white mb-3 text-center">Qualité Hospitalière</h3>
              <p className="text-gray-400 text-sm text-center">
                Scénarios développés avec l'Hôpital Saint-Louis pour une formation authentique.
              </p>
          </div>
          </div>
        </div>
      </section>

      {/* Scenarios Section */}
      <section id="scenarios" className="relative z-10 py-20 px-6 bg-gray-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Scénarios de Formation
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Situations d'urgence réelles pour une formation médicale complète
            </p>
        </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Fibrillation Ventriculaire</h3>
              </div>
              <p className="text-gray-400 text-sm">
                Défibrillation d'urgence avec défibrillateur manuel. Maîtrisez la reconnaissance ECG et la délivrance de choc.
              </p>
            </div>

            <div className="p-6 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Utilisation DAE</h3>
              </div>
              <p className="text-gray-400 text-sm">
                Formation au Défibrillateur Automatisé Externe pour réponse aux arrêts cardiaques.
              </p>
          </div>

            <div className="p-6 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Stimulation Cardiaque</h3>
              </div>
              <p className="text-gray-400 text-sm">
                Stimulation cardiaque d'urgence pour bradycardie avec ajustement des paramètres.
              </p>
            </div>

            <div className="p-6 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Cardioversion</h3>
              </div>
              <p className="text-gray-400 text-sm">
                Cardioversion synchronisée pour traitement de la fibrillation atriale.
              </p>
                    </div>
                    </div>
                  </div>
      </section>

      {/* About Section */}
      <section id="about" className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-8">
            Développé pour l'Excellence Médicale
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed mb-8">
            Ce simulateur a été créé lors d'un stage de développement web de 2 mois à 
            <span className="text-white font-semibold"> l'Hôpital Saint-Louis</span>. 
            Notre mission est de fournir un outil de formation médicale accessible et de haute qualité 
            pour préparer les professionnels de santé à situations d'urgence réelles.
          </p>
          
                      <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Professionnels de Santé</span>
              </div>
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4" />
                <span>Scénarios Réels</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Formation Sécurisée</span>
              </div>
            </div>
        </div>
      </section>

      {/* Contributors Section */}
      <section id="contributors" className="relative z-10 py-20 px-6 bg-gray-900/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Contributeurs
            </h2>

          </div>
          
          <div style={{ position: 'relative', marginTop: '100px'}}>
            <ChromaGrid 
              items={[
                {
                  image: "/images/marcdinh.jpg",
                  title: "Marc Dinh",
                  subtitle: "ML/Deep Learning Engineer",
                  borderColor: "#3B82F6",
                  gradient: "linear-gradient(145deg, #3B82F6, #000)",
                  url: "https://www.linkedin.com/in/marc-dinh/"
                },
                {
                  image: "/images/mariusgal.jpg",
                  title: "Marius GAL",
                  subtitle: "Stage dev web",
                  borderColor: "#10B981",
                  gradient: "linear-gradient(145deg, #3B82F6, #000)",
                  url: "https://www.linkedin.com/in/marius-gal/"
                },
                {
                  image: "/images/samiellouze.jpg",
                  title: "Dr. Sami Ellouze",
                  subtitle: "Médecin Urgentiste",
                  borderColor: "#EF4444",
                  gradient: "linear-gradient(145deg, #3B82F6, #000)",
                  url: "https://www.linkedin.com/in/sami-ellouze-23791330/"
                }
              ]}
              radius={300}
              imageSize="w-full h-full md:w-80 md:h-90"
              damping={0.45}
              ease="power3.out"
              imageClassName="p-4"
              imageBorderRadius="rounded-3xl"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-6 border-t border-gray-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center">
          <div className="text-gray-500 text-sm text-center md:text-right">
            © 2025 Plateforme de Formation d'Urgence Médicale
            <br className="md:hidden" />
            <span className="hidden md:inline"> • </span>
            Développé pour l'Hôpital Saint-Louis
          </div>
        </div>
      </footer>
    </div>
  );
}