import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SliceState {
	rating: number | null;
	positives: Array<string> | null;
	negatives: Array<string> | null;
	statusCode: number | null;
}

const initialState: SliceState = {
	rating: 0,
	positives: null,
	negatives: null,
	statusCode: null,
};

const slice = createSlice({
	name: 'slice',
	initialState,
	reducers: {
		setReportData(
			state,
			action: PayloadAction<{ rating: number; positives: string[]; negatives: string[] }>
		) {
			console.log('payload ', action.payload);
			state.rating = action.payload.rating;
			state.positives = action.payload.positives;
			state.negatives = action.payload.negatives;
		},
		setStatusCode(state, action: PayloadAction<number>) {
			console.log('payload ', action.payload);
			state.statusCode = action.payload;
		},
	},
});

export const { setReportData, setStatusCode } = slice.actions;
export default slice.reducer;
