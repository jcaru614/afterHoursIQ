import { configureStore } from '@reduxjs/toolkit';
import sliceReducer from './slice'; 

export const store = configureStore({
	reducer: {
		slice: sliceReducer, 
	},
});

export default store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
