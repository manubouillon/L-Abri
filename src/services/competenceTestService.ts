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