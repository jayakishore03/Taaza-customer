export {};

declare global {
  namespace ExpoRouter {
    interface RootParamList {
      payment: { total?: string };
    }
  }
}

