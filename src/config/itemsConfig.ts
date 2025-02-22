export type ItemType = 
  | 'minerai-fer' | 'minerai-cuivre' | 'minerai-silicium' | 'minerai-or'
  | 'minerai-charbon' | 'minerai-calcaire'
  | 'lingot-fer' | 'lingot-cuivre' | 'lingot-silicium' | 'lingot-or' | 'lingot-acier'
  | 'baril-petrole' | 'baril-vide' | 'carburant'
  | 'laitue' | 'tomates' | 'avoine' | 'nourriture-conserve'
  | 'soie' | 'vetements' | 'embryon-humain'

export type ItemCategory = 'biologique' | 'ressource' | 'nourriture' | 'conteneur' | 'ressource-brute'

export interface BaseItemConfig {
  name: string
  stackSize: number
  description: string
  category: ItemCategory
}

export interface FoodItemConfig extends BaseItemConfig {
  category: 'nourriture'
  ratio: number
  qualite: number
  conservation: number
}

export interface ResourceItemConfig extends BaseItemConfig {
  category: 'ressource' | 'ressource-brute'
}

export interface BiologicalItemConfig extends BaseItemConfig {
  category: 'biologique'
}

export interface ContainerItemConfig extends BaseItemConfig {
  category: 'conteneur'
}

export type ItemConfig = FoodItemConfig | ResourceItemConfig | BiologicalItemConfig | ContainerItemConfig

export const ITEMS_CONFIG: { [key in ItemType]: ItemConfig } = {
  'embryon-humain': {
    name: 'Embryon humain',
    stackSize: 1,
    description: 'Un embryon humain cryogénisé',
    category: 'biologique'
  } as BiologicalItemConfig,
  'avoine': {
    name: 'Avoine',
    stackSize: 1000,
    description: 'Des grains d\'avoine cultivés dans les serres.',
    category: 'nourriture',
    ratio: 5,
    qualite: 1,
    conservation: 0.9
  } as FoodItemConfig,
  'tomates': {
    name: 'Tomates',
    stackSize: 1000,
    description: 'Des tomates fraîches cultivées dans les serres.',
    category: 'nourriture',
    ratio: 3,
    qualite: 2,
    conservation: 0.7
  } as FoodItemConfig,
  'laitue': {
    name: 'Laitue',
    stackSize: 1000,
    description: 'De la laitue fraîche cultivée dans les serres.',
    category: 'nourriture',
    ratio: 4,
    qualite: 1.5,
    conservation: 0.6
  } as FoodItemConfig,
  'nourriture-conserve': {
    name: 'Nourriture en conserve',
    stackSize: 200,
    description: 'De la nourriture en conserve produite dans la cuisine.',
    category: 'nourriture',
    ratio: 1,
    qualite: 0.5,
    conservation: 1
  } as FoodItemConfig,
  'minerai-fer': {
    name: 'Minerai de fer',
    stackSize: 1000,
    description: 'Du minerai de fer brut.',
    category: 'ressource-brute'
  } as ResourceItemConfig,
  'minerai-cuivre': {
    name: 'Minerai de cuivre',
    stackSize: 1000,
    description: 'Du minerai de cuivre brut.',
    category: 'ressource-brute'
  } as ResourceItemConfig,
  'minerai-silicium': {
    name: 'Minerai de silicium',
    stackSize: 1000,
    description: 'Du minerai de silicium brut.',
    category: 'ressource-brute'
  } as ResourceItemConfig,
  'minerai-or': {
    name: 'Minerai d\'or',
    stackSize: 1000,
    description: 'Du minerai d\'or brut.',
    category: 'ressource-brute'
  } as ResourceItemConfig,
  'minerai-charbon': {
    name: 'Charbon',
    stackSize: 1000,
    description: 'Du charbon brut.',
    category: 'ressource-brute'
  } as ResourceItemConfig,
  'minerai-calcaire': {
    name: 'Calcaire',
    stackSize: 1000,
    description: 'Du calcaire brut.',
    category: 'ressource-brute'
  } as ResourceItemConfig,
  'lingot-fer': {
    name: 'Lingot de fer',
    stackSize: 100,
    description: 'Un lingot de fer raffiné.',
    category: 'ressource'
  } as ResourceItemConfig,
  'lingot-cuivre': {
    name: 'Lingot de cuivre',
    stackSize: 100,
    description: 'Un lingot de cuivre raffiné.',
    category: 'ressource'
  } as ResourceItemConfig,
  'lingot-silicium': {
    name: 'Lingot de silicium',
    stackSize: 100,
    description: 'Un lingot de silicium raffiné.',
    category: 'ressource'
  } as ResourceItemConfig,
  'lingot-or': {
    name: 'Lingot d\'or',
    stackSize: 100,
    description: 'Un lingot d\'or raffiné.',
    category: 'ressource'
  } as ResourceItemConfig,
  'lingot-acier': {
    name: 'Lingot d\'acier',
    stackSize: 100,
    description: 'Un lingot d\'acier raffiné.',
    category: 'ressource'
  } as ResourceItemConfig,
  'baril-petrole': {
    name: 'Baril de pétrole',
    stackSize: 10,
    description: 'Un baril de pétrole brut.',
    category: 'ressource-brute'
  } as ResourceItemConfig,
  'baril-vide': {
    name: 'Baril vide',
    stackSize: 10,
    description: 'Un baril vide.',
    category: 'conteneur'
  } as ContainerItemConfig,
  'soie': {
    name: 'Soie',
    stackSize: 1000,
    description: 'De la soie produite par les vers à soie.',
    category: 'ressource'
  } as ResourceItemConfig,
  'vetements': {
    name: 'Vêtements',
    stackSize: 100,
    description: 'Des vêtements confectionnés dans l\'atelier.',
    category: 'ressource'
  } as ResourceItemConfig,
  'carburant': {
    name: 'Carburant raffiné',
    stackSize: 1000,
    description: 'Du carburant raffiné prêt à l\'emploi.',
    category: 'ressource'
  } as ResourceItemConfig
} as const 