import type { Habitant, Room } from '../stores/gameStore'
import { ROOM_TYPES } from '../config/roomsConfig'
import { useGameStore } from '../stores/gameStore'

export interface CompetenceTest {
  id: string
  timestamp: number
  habitantId: string
  habitantNom: string
  salle: string
  competence: string
  valeurCompetence: number
  resultat: number
  type: 'critique' | 'succes' | 'echec' | 'echec-critique'
}

export function effectuerTest(habitant: Habitant, room: Room): CompetenceTest {
  const gameStore = useGameStore()
  
  // Trouver la compétence requise pour la salle
  const roomType = ROOM_TYPES.find(rt => rt.id === room.type)
  if (!roomType) {
    throw new Error(`Type de salle inconnu: ${room.type}`)
  }

  const competence = roomType.competence
  const valeurCompetence = habitant.competences[competence]
  
  // Lancer le dé (1-10)
  const resultat = Math.floor(Math.random() * 10) + 1

  // Déterminer le type de résultat
  let type: 'critique' | 'succes' | 'echec' | 'echec-critique'
  if (resultat === 1) {
    type = 'critique'
  } else if (resultat === 10) {
    type = 'echec-critique'
  } else if (resultat <= valeurCompetence) {
    type = 'succes'
  } else {
    type = 'echec'
  }

  // Ajouter de l'expérience en fonction du type de résultat
  let pointsXP = 0;
  switch (type) {
    case 'critique':
      pointsXP = 10;
      break;
    case 'succes':
      pointsXP = 5;
      break;
    case 'echec':
      pointsXP = 2;
      break;
    case 'echec-critique':
      pointsXP = 1;
      break;
  }
  ajouterExperience(habitant, competence, pointsXP);

  return {
    id: `${gameStore.gameTime}-${habitant.id}`,
    timestamp: gameStore.gameTime,
    habitantId: habitant.id,
    habitantNom: habitant.nom,
    salle: room.type,
    competence,
    valeurCompetence,
    resultat,
    type
  }
}

// Fonction utilitaire pour obtenir l'emoji correspondant au type de résultat
export function getResultatEmoji(type: CompetenceTest['type']): string {
  switch (type) {
    case 'critique':
      return '🌟'
    case 'succes':
      return '✅'
    case 'echec':
      return '❌'
    case 'echec-critique':
      return '💥'
  }
}

// Fonction utilitaire pour obtenir la couleur correspondant au type de résultat
export function getResultatColor(type: CompetenceTest['type']): string {
  switch (type) {
    case 'critique':
      return '#ffd700' // Or
    case 'succes':
      return '#2ecc71' // Vert
    case 'echec':
      return '#e74c3c' // Rouge
    case 'echec-critique':
      return '#c0392b' // Rouge foncé
  }
}

// Fonction pour ajouter de l'expérience à une compétence
function ajouterExperience(habitant: Habitant, competence: string, points: number) {
  habitant.experience[competence as keyof typeof habitant.experience] += points;

  // Vérifier si le seuil de montée de niveau est atteint
  const seuil = calculerSeuil(habitant.competences[competence as keyof typeof habitant.competences]);
  if (habitant.experience[competence as keyof typeof habitant.experience] >= seuil) {
    const ancienNiveau = habitant.competences[competence as keyof typeof habitant.competences];
    habitant.competences[competence as keyof typeof habitant.competences] += 1;
    habitant.experience[competence as keyof typeof habitant.experience] = 0; // Réinitialiser l'expérience après la montée de niveau
    
    // Afficher une notification de montée de niveau
    window.dispatchEvent(new CustomEvent('notification', {
      detail: {
        title: 'Progression',
        message: `${habitant.nom} a atteint le niveau ${ancienNiveau + 1} en ${competence} !`,
        type: 'success'
      }
    }))
  }
}

// Fonction pour calculer le seuil de montée de niveau
function calculerSeuil(niveau: number): number {
  return 100 * Math.pow(1.5, niveau); // Exemple de calcul de seuil
}

// Fonction pour calculer le bonus de production basé sur les tests
export function calculateProductionBonus(tests: CompetenceTest[]): number {
  if (tests.length === 0) return 1.0

  // On prend la moyenne des 3 derniers tests maximum
  const recentTests = tests.slice(-3)
  
  return recentTests.reduce((sum, test) => {

    switch (test.type) {
      case 'critique':
        return sum + 1.3 // 130% de production
      case 'succes':
        return sum + 1.0 // 100% de production
      case 'echec':
        return sum + 0.7 // 70% de production
      case 'echec-critique':
        return sum + 0.5 // 50% de production
    }
  }, 0) / recentTests.length
} 