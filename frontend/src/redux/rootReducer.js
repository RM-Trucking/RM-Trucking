import { combineReducers } from 'redux';
import storage from 'redux-persist/lib/storage';
// import slices
import dashboardReducer from './slices/dashboard';
import customerReducer from './slices/customer';
import rateReducer from './slices/rate';
import noteReducer from './slices/note';
// ----------------------------------------------------------------------

const rootPersistConfig = {
  key: 'root',
  storage,
  keyPrefix: 'redux-',
  whitelist: [],
};

const rootReducer = combineReducers({
  // combine reducers
  dashboarddata : dashboardReducer,
  customerdata : customerReducer,
  ratedata : rateReducer,
  notedata : noteReducer,
});

export { rootPersistConfig, rootReducer };
