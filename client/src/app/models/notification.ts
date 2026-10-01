export interface Notification {
  _id: string;
  recipient: string;
  sender: {
    _id: string;
    name: string;
  };
  type: 'REVIEW' | 'SAVE';
  message: string;
  recipe: {
    _id: string;
    title: string;
  };
  read: boolean;
  createdAt: string;
  updatedAt: string;
}