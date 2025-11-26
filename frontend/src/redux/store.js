// import { Auth } from 'aws-amplify';
import { configureStore } from '@reduxjs/toolkit';
import { useDispatch as useAppDispatch, useSelector as useAppSelector } from 'react-redux';
import { persistStore, persistReducer } from 'redux-persist';
import { rootPersistConfig, rootReducer } from './rootReducer';


// Middle wares

// const currentSession = store => next => action => {
//   // console.log('Dispatch Middleware')
//   Auth.currentSession()
//   .then(async data => {
//     // console.log('Session', data)
//     const currentUser = await Auth.currentAuthenticatedUser()
//     // console.log('current user', currentUser)
//     next(action)
//   })
//   .catch(err => {
//     console.log('Failed to fetch session', err.message)
//     next(action)
//   });
  
  
// }

// ----------------------------------------------------------------------

const store = configureStore({
  reducer: persistReducer(rootPersistConfig, rootReducer),
  middleware: (getDefaultMiddleware) =>
    [...getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }) ],
});

const persistor = persistStore(store);

const { dispatch } = store;

const useSelector = useAppSelector;

const useDispatch = () => useAppDispatch();

export { store, persistor, dispatch, useSelector, useDispatch };
