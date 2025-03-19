import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SliceState {
  rating: number | null;
  positives: Array<string> | null;
  negatives: Array<string> | null;
  statusCode: number | null;
  companyDomain: string | null;
  reportUrl: string | null; // Add this line
}

const initialState: SliceState = {
  rating: 0,
  positives: null,
  negatives: null,
  statusCode: null,
  companyDomain: null,
  reportUrl: null,
};

const slice = createSlice({
  name: 'slice',
  initialState,
  reducers: {
    setReportData(
      state,
      action: PayloadAction<{
        rating: number;
        positives: string[];
        negatives: string[];
        reportUrl: string;
      }>
    ) {
      state.rating = action.payload.rating;
      state.positives = action.payload.positives;
      state.negatives = action.payload.negatives;
      state.reportUrl = action.payload.reportUrl;
    },
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
