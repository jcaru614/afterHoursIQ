import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SliceState {
	rating: number | null;
	summary: string | null;
}

const initialState: SliceState = {
	rating: 0,
	summary: '',
};

const slice = createSlice({
	name: 'slice',
	initialState,
	reducers: {
		setReportData(state, action: PayloadAction<{ rating: number; summary: string }>) {
			console.log('payload ', action.payload);
			state.rating = action.payload.rating;
			state.summary = action.payload.summary;
		},
	},
});

export const { setReportData } = slice.actions;
export default slice.reducer;
