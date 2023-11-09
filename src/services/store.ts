import { configureStore } from "@reduxjs/toolkit";
import { SensorApi } from "./api";
import { setupListeners } from "@reduxjs/toolkit/query";

export const store = configureStore({
  reducer: {
    [SensorApi.reducerPath]: SensorApi.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(SensorApi.middleware),
});

setupListeners(store.dispatch);
