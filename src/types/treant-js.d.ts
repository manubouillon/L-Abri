declare module 'treant-js' {
  interface TreantConfig {
    chart: {
      container: string;
      levelSeparation?: number;
      siblingSeparation?: number;
      subTeeSeparation?: number;
      rootOrientation?: string;
      nodeAlign?: string;
      padding?: number;
      node?: {
        HTMLclass?: string;
      };
    };
    nodeStructure: {
      text: { name: string };
      HTMLclass?: string;
      children?: Array<{
        text: { name: string };
        HTMLclass?: string;
        children?: any[];
      }>;
    };
  }

  export default class Treant {
    constructor(config: TreantConfig);
  }
} 