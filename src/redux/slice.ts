import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SliceState {
	rating: number | null;
	positives: Array<string> | null;
	negatives: Array<string> | null;
	statusCode: number | null;
	// companyOverview: Record<string, any> | null;
	companyDomain: string | null;
}

const initialState: SliceState = {
	rating: 0,
	positives: null,
	negatives: null,
	statusCode: null,
	// companyOverview: null,
	companyDomain: null,
};

const slice = createSlice({
	name: 'slice',
	initialState,
	reducers: {
		setReportData(
			state,
			action: PayloadAction<{ rating: number; positives: string[]; negatives: string[] }>
		) {
			state.rating = action.payload.rating;
			state.positives = action.payload.positives;
			state.negatives = action.payload.negatives;
		},
		// setCompanyOverview(state, action: PayloadAction<Record<string, any>>) {
		// 	state.companyOverview = action.payload;
		// },
		setCompanyDomain(state, action: PayloadAction<string>) {
			state.companyDomain = action.payload;
		},
		setStatusCode(state, action: PayloadAction<number>) {
			state.statusCode = action.payload;
		},
	},
});
export const { setReportData, setCompanyDomain, setStatusCode } = slice.actions;
export default slice.reducer;
