import { configureStore } from '@reduxjs/toolkit';
import sliceReducer from './slice'; // Import the reducer from slice

export const store = configureStore({
	reducer: {
		slice: sliceReducer, // Register the slice here
	},
});

export default store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
