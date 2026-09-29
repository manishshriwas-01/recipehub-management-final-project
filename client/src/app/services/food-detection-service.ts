import { Injectable } from '@angular/core';

declare const mobilenet: any;

@Injectable({
  providedIn: 'root',
})
export class FoodDetectionService {
  private model: any = null;

  async loadModel() {
    if (!this.model) {
      this.model = await mobilenet.load();
    }

    return this.model;
  }

  async classifyImage(file: File) {
    const model = await this.loadModel();
    const image = await this.createImageElement(file);

    return model.classify(image);
  }
  isFood(predictions: any[]): boolean {
  const foodKeywords = [
    'pizza',
    'burger',
    'hamburger',
    'cheeseburger',
    'hotdog',
    'hot dog',
    'potpie',
    'pie',
    'cake',
    'ice cream',
    'icecream',
    'banana',
    'apple',
    'orange',
    'lemon',
    'pineapple',
    'strawberry',
    'pancake',
    'waffle',
    'burrito',
    'taco',
    'guacamole',
    'carbonara',
    'espresso',
    'coffee',
    'pretzel',
    'bagel',
    'bread',
    'sandwich',
    'soup',
    'hot pot',
  ];

  return predictions.some((prediction) => {
    const label = prediction.className.toLowerCase();

    return (
      prediction.probability >= 0.15 &&
      foodKeywords.some((keyword) => label.includes(keyword))
    );
  });
}

  private createImageElement(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);

      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(image);
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Unable to read image'));
      };

      image.src = objectUrl;
    });
  }
}