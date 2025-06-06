export interface MappingPoint {
  angle: number;
  value: string;
}

export class RotaryMappingService {
  private static readonly MAPPING_POINTS: MappingPoint[] = [
    { angle: 0, value: "0" },
    { angle: 20, value: "1-10" },
    { angle: 40, value: "15" },
    { angle: 60, value: "20" },
    { angle: 80, value: "30" },
    { angle: 100, value: "50" },
    { angle: 120, value: "70" },
    { angle: 140, value: "100" },
    { angle: 160, value: "120" },
    { angle: 180, value: "150" },
    { angle: 200, value: "170" },
    { angle: 220, value: "200" },
    { angle: 240, value: "Simulateur" },
  ];

  /**
   * Mappe la valeur du rotary (angle) vers la valeur prédéfinie
   */
  static mapRotaryToValue(rotaryAngle: number): string {
    // Trouver le point le plus proche
    let closestPoint = this.MAPPING_POINTS[0];
    let minDifference = Math.abs(rotaryAngle - closestPoint.angle);

    for (const point of this.MAPPING_POINTS) {
      const difference = Math.abs(rotaryAngle - point.angle);
      if (difference < minDifference) {
        minDifference = difference;
        closestPoint = point;
      }
    }

    return closestPoint.value;
  }

  /**
   * Obtient la liste des points de mapping (pour debug ou affichage)
   */
  static getMappingPoints(): MappingPoint[] {
    return [...this.MAPPING_POINTS];
  }

  /**
   * Valide si une valeur est dans la liste des valeurs acceptables
   */
  static isValidValue(value: string): boolean {
    return this.MAPPING_POINTS.some(point => point.value === value);
  }
} 