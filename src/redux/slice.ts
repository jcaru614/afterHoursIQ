import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SliceState {
  rating: number | null;
  positives: Array<string> | null;
  negatives: Array<string> | null;
  statusCode: number | null;
  reportUrl: string | null;
}

const initialState: SliceState = {
  rating: 0,
  positives: null,
  negatives: null,
  statusCode: null,
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
    setStatusCode(state, action: PayloadAction<number>) {
      state.statusCode = action.payload;
    },
    clearStatusCode(state) {
      state.statusCode = null;
    },
  },
});

export const { setReportData, setStatusCode, clearStatusCode } = slice.actions;
export default slice.reducer;
