import { API_service } from './api/apiService';
import { getDatabase, ref, get } from 'firebase/database';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from './api/firebase/firebaseConfig';
import renderFilmsMarkup from './librender/renderFilmsMarkup';
import dataStorage from './api/firebase/data-storage';
import { onOpenModalAuth } from './api/firebase/auth-settings';
import { Loading } from 'notiflix/build/notiflix-loading-aio';

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

const userData = {
  queue: {},
  watched: {},
};
new dataStorage(userData);
const filmsApi = new API_service();

const authBtn = document.querySelector('#auth');
const watchedBtnRef = document.querySelector('.js-watched');
const queueBtnRef = document.querySelector('.js-queue');
const filmsList = document.querySelector('.library__container-list');
const emptyMessage = document.querySelector('.library__mes');

queueBtnRef.addEventListener('click', onQueueBtnClick);
watchedBtnRef.addEventListener('click', onWatchedBtnClick);
authBtn.addEventListener('click', onOpenModalAuth);

onWatchedBtnClick();

function onWatchedBtnClick() {
  if (watchedBtnRef.classList.contains('current')) return;
  Loading.pulse({
    svgColor: 'orange',
  });

  onAuthStateChanged(auth, user => {
    if (user) {
      const libDataBase = `users/${user.uid}/lib/watched/`;

      get(ref(db, libDataBase))
        .then(snapshot => {
          if (snapshot.exists()) {
            const ids = Object.keys(snapshot.val());
            if (!emptyMessage.classList.contains('visually-hidden')) {
              emptyMessage.classList.add('visually-hidden');
            }
            renderMarkupByIds(ids);
            //Render
          } else {
            if (emptyMessage.classList.contains('visually-hidden')) {
              emptyMessage.classList.remove('visually-hidden');
            }
            filmsList.innerHTML = '';
            console.log('No data available');
          }
        })
        .catch(error => {
          console.error(error);
        });
      Loading.remove();
    }
  });

  watchedBtnRef.classList.add('is-active');
  queueBtnRef.classList.remove('is-active');
}

function onQueueBtnClick() {
  if (queueBtnRef.classList.contains('is-active')) return;
  queueBtnRef.classList.add('is-active');
  watchedBtnRef.classList.remove('is-active');

  Loading.pulse({
    svgColor: 'orange',
  });

  onAuthStateChanged(auth, user => {
    if (user) {
      const libDataBase = `users/${user.uid}/lib/queue/`;

      get(ref(db, libDataBase))
        .then(snapshot => {
          if (snapshot.exists()) {
            const ids = Object.keys(snapshot.val());
            if (!emptyMessage.classList.contains('visually-hidden')) {
              emptyMessage.classList.add('visually-hidden');
            }
            renderMarkupByIds(ids);
            //render
          } else {
            if (emptyMessage.classList.contains('visually-hidden')) {
              emptyMessage.classList.remove('visually-hidden');
            }
            filmsList.innerHTML = '';

            console.log('No data available');
          }
        })
        .catch(error => {
          console.error(error);
        });
    }
  });
  Loading.remove();
}

export default async function renderMarkupByIds(ids) {
  try {
    Loading.pulse({
      svgColor: 'orange',
    });
    const arrProm = ids.map(async id => {
      filmsApi.id = id;
      return await filmsApi.fetchMovieById();
    });
    const films = await Promise.all(arrProm);
    renderFilmsMarkup(films);
    Loading.remove();
  } catch (error) {
    console.log(error);
  }
}
