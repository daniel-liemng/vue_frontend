import Vue from 'vue';
import Vuex from 'vuex';

import axios from './axios-auth';
import globalAxios from 'axios';

import router from './router';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    idToken: null,
    userId: null,
    user: null
  },
  getters: {
    // Get user info to use in Dashboard
    user(state) {
      return state.user;
    },
    // Check if auth to use in Navigation
    isAuthenticated(state) {
      return state.idToken !== null;
    }
  },
  mutations: {
    // AuthUser Mutation -> store idToken and userId
    authUser(state, userData) {
      state.idToken = userData.token;
      state.userId = userData.userId;
    },
    // StoreUser Mutation -> store all userData
    storeUser(state, userData) {
      state.user = userData;
    },
    // ClearAuthData Mutation to clear idToken and userId when log out
    clearAuthData(state) {
      state.idToken = null;
      state.userId = null;
    }
  },
  actions: {
    // Sign up Action
    signup({ commit, dispatch }, authData) {
      // use auth axios URL
      axios
        .post('/accounts:signUp?key=AIzaSyCHQd_Xnwazbce1W22UTkVEpEnzVL7DK0A', {
          email: authData.email,
          password: authData.password,
          returnSecureToken: true
        })
        .then(res => {
          console.log(res);
          // Call commit to store idToken and localId
          commit('authUser', {
            token: res.data.idToken,
            userId: res.data.localId
          });
          // Store token in localStorage
          const now = new Date();
          const expirationDate = new Date(
            now.getTime() + res.data.expiresIn * 1000
          );
          localStorage.setItem('token', res.data.idToken);
          localStorage.setItem('userId', res.data.localId);
          localStorage.setItem('expirationDate', expirationDate);
          // Call action to pass all userData
          dispatch('storeUsers', authData);
          // Auto Logout Timer
          dispatch('setLogoutTimer', res.data.expiresIn);
        })
        .catch(err => console.log(err));
    },
    // Login Action
    login({ commit, dispatch }, authData) {
      axios
        .post(
          '/accounts:signInWithPassword?key=AIzaSyCHQd_Xnwazbce1W22UTkVEpEnzVL7DK0A',
          {
            email: authData.email,
            password: authData.password,
            returnSecureToken: true
          }
        )
        .then(res => {
          console.log(res);
          // Store token in localStorage
          const now = new Date();
          const expirationDate = new Date(
            now.getTime() + res.data.expiresIn * 1000
          );
          localStorage.setItem('token', res.data.idToken);
          localStorage.setItem('userId', res.data.localId);
          localStorage.setItem('expirationDate', expirationDate);
          // get token and userId from server to state
          commit('authUser', {
            token: res.data.idToken,
            userId: res.data.localId
          });
          // Auto logout timer
          dispatch('setLogoutTimer', res.data.expiresIn);
        })
        .catch(err => console.log(err));
    },
    // Auto Login when reload
    tryAutoLogin({ commit }) {
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }
      const expirationDate = localStorage.getItem('expirationDate');
      const now = new Date();
      if (now >= expirationDate) {
        return;
      }
      const userId = localStorage.getItem('userId');
      // Pass token and userId from localStorage to Vuex state
      commit('authUser', {
        token: token,
        userId: userId
      });
    },
    // Logout Action
    logout({ commit }) {
      commit('clearAuthData');
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('expirationDate');
      router.replace('/signin');
    },
    setLogoutTimer({ commit }, expirationTime) {
      setTimeout(() => {
        commit('clearAuthData');
        // Or call logout()
        // dispatch('logout');
      }, expirationTime * 1000);
    },
    // Store Users Action
    storeUsers({ commit, state }, userData) {
      // Check if token exists
      if (!state.idToken) {
        return;
      }
      globalAxios
        .post('/users.json' + '?auth=' + state.idToken, userData)
        .then(res => console.log(res))
        .catch(err => console.log(err));
    },
    // Fetch Users Action
    fetchUser({ commit, state }) {
      // Check if token exists
      if (!state.idToken) {
        return;
      }
      globalAxios
        .get('/users.json' + '?auth=' + state.idToken)
        .then(res => {
          console.log(res.data);
          const data = res.data;
          const users = [];
          for (let key in data) {
            const user = data[key];
            user.id = key;
            users.push(user);
          }
          console.log(users);
          // this.email = users[0].email;
          commit('storeUser', users[2]);
        })
        .catch(err => console.log(err));
    }
  }
});
