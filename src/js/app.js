import axios from 'axios'
import cityName from '../data/city.json'
import L from 'leaflet'
import 'leaflet.locatecontrol'
import 'leaflet.markercluster'

//-------------------宣導圖
document.querySelector('.tip').addEventListener('click', function() {
  let cardBox = document.querySelector('.cardBox').classList
  cardBox.add('active')
})

document.querySelector('.cardBox').addEventListener('click', e => {
  e.preventDefault()
  e.currentTarget.classList.remove('active')
})
//-------------------顯示時間
let date = new Date()
//month 會從0開始算
let year = date.getFullYear()
let month = date.getMonth() + 1
let day = date.getDate()

document.querySelector('.date').textContent = `${year}/${month}/${day}`

//--------------------option選項

let selectCity = document.querySelector('#selectCity')
let selectTown = document.querySelector('#selectTown')
let searchName = document.querySelector('#searchName')
let searchButton = document.querySelector('.search-button')
let listGroup = document.querySelector('.list-group')
let loading = document.querySelector('.loading')
let storeData = []
let osmMap = {}

document.addEventListener('DOMContentLoaded', function() {
  setMapPoint()
  updateCounty(cityName)
  updateTown(cityName)
})
;(function ajaxData() {
  axios
    .get(
      'https://raw.githubusercontent.com/kiang/pharmacies/master/json/points.json'
    )
    .then(res => {
      const response = res.data.features
      const filterResponse = response.filter(
        element =>
          element.properties.county === selectCity.value &&
          element.properties.town === selectTown.value
      )

      storeData = response

      updateMarker(storeData)
      updateSidebar(filterResponse)

      loading.setAttribute('style', 'display: none')
    })
    .catch(err => console.log(err))
})()

function updateCounty(cityData) {
  let str = ''
  for (let i = 0; i < cityData.length; i++) {
    str += `
    <option style="border-radius: 20px"
    value="${cityData[i].CityName}">${cityData[i].CityName}</option>
		`
  }
  selectCity.innerHTML = str
}
function updateTown(cityData) {
  let str = ''
  const townData = cityData.filter(city => city.CityName === selectCity.value)

  for (let i = 0; i < townData[0].AreaList.length; i++) {
    str += `
    <option value="${townData[0].AreaList[i].AreaName}">
    ${townData[0].AreaList[i].AreaName}</option>
    `
  }
  selectTown.innerHTML = str
}

function setMapPoint() {
  osmMap = L.map('map', {
    center: [25.04828, 121.51435],
    zoom: 16
  })
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '作者 Frank '
  }).addTo(osmMap)
  L.control
    .locate({
      showPopup: false
    })
    .addTo(osmMap)
    .start()
}

function searchPharmacies(data) {
  const searchText = searchName.value
  if (searchText === '') {
    return alert('請輸入資料')
  }
  const pharmacies = data.filter(
    pharmacy =>
      pharmacy.properties.address.includes(searchText) ||
      pharmacy.properties.name.match(searchText)
  )
  updateSidebar(pharmacies)
}
function selectPharmaciesArea(data) {
  const pharmacies = data.filter(
    element =>
      element.properties.county === selectCity.value &&
      element.properties.town === selectTown.value
  )
  updateSidebar(pharmacies)
  panToMarker(pharmacies[0])
}

function updateMarker(data) {
  let markers = new L.MarkerClusterGroup()

  data.forEach(pharmacy => {
    const { geometry, properties } = pharmacy
    const iconColor = (function() {
      if (properties.mask_adult === 0) {
        return new L.Icon({
          iconUrl:
            'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
          shadowUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        })
      } else {
        return new L.Icon({
          iconUrl:
            'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
          shadowUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        })
      }
    })()

    markers.addLayer(
      L.marker([geometry.coordinates[1], geometry.coordinates[0]], {
        icon: iconColor
      }).bindPopup(`
      <li class="list-group-item  border-0">
        <h5 class="card-title">${properties.name}</h5>
        <p class=" ">電話: ${properties.phone} </p>
        <p class=" ">地址: <a  href="https://www.google.com.tw/maps/place/${
          properties.address
        }" target="_blank">${properties.address}</a></p>
        <p class=" ">更新時間: ${properties.updated}</p>
        <p class=" mb-1 ">注意事項: ${
          properties.custom_note === '' ? '無' : properties.custom_note
        }</p>
        <div class="mask d-flex justify-content-center mt-5">
          <a href="#" class="btn btn-blue  mr-2 d-inline-block text-light">成人口罩:${
            properties.mask_adult
          }</a>
          <a href="#" class="btn btn-pink  d-inline-block text-light">兒童口罩: ${
            properties.mask_child
          }</a>
        </div>
      </li>`)
    )
    osmMap.addLayer(markers)
  })
}

function updateSidebar(data) {
  let str = ''

  data.forEach(pharmacy => {
    const { properties } = pharmacy
    str += `
    <li class="list-group-item ">
      <h5 class="card-title">${properties.name}</h5>
      <p class=" mb-1">電話: ${properties.phone} </p>
      <p class=" mb-1">地址: <a  href="https://www.google.com.tw/maps/place/${
        properties.address
      }" target="_blank">${properties.address}</a></p>
      <p class=" mb-1 ">更新時間: ${properties.updated}</p>
      <p class=" mb-1 ">注意事項: ${
        properties.custom_note === '' ? '無' : properties.custom_note
      }</p>
      <div class="mask d-flex justify-content-between mt-5">
        <a href="#" class="btn btn-blue w-50 mr-2 text-light">成人口罩:${
          properties.mask_adult
        }</a>
        <a href="#" class="btn btn-pink w-50 text-light">兒童口罩: ${
          properties.mask_child
        }</a>
      </div>
    </li>`
  })
  listGroup.innerHTML = str
  // 增加List click事件
  document.querySelectorAll('.list-group-item').forEach((element, index) => {
    element.addEventListener('click', function(e) {
      e.stopPropagation()
      panToMarker(data[index])
    })
  })
}

function panToMarker(data) {
  const { geometry, properties } = data
  const lat = geometry.coordinates[1]
  const lon = geometry.coordinates[0]

  osmMap.panTo([lat, lon])
  L.marker([lat, lon])
    .addTo(osmMap)
    .bindPopup(
      `
      <li class="list-group-item  border-0">
        <h5 class="card-title">${properties.name}</h5>
        <p class=" ">電話: ${properties.phone} </p>
        <p class=" ">地址: <a  href="https://www.google.com.tw/maps/place/${
          properties.address
        }" target="_blank">${properties.address}</a></p>
        <p class=" ">更新時間: ${properties.updated}</p>
        <p class=" mb-1 ">注意事項: ${
          properties.custom_note === '' ? '無' : properties.custom_note
        }</p>
        <div class="mask d-flex justify-content-between mt-5">
          <a href="#" class="btn btn-blue w-50 mr-1 d-inline-block text-light">成人口罩:${
            properties.mask_adult
          }</a>
          <a href="#" class="btn btn-pink w-50 d-inline-block text-light">兒童口罩: ${
            properties.mask_child
          }</a>
        </div>
      </li>`
    )
    .openPopup()
}

selectCity.addEventListener('change', function() {
  updateTown(cityName)
  selectPharmaciesArea(storeData)
})

selectTown.addEventListener('change', function() {
  selectPharmaciesArea(storeData)
})

searchButton.addEventListener('click', e => {
  e.preventDefault()
  searchPharmacies(storeData)
})

searchName.addEventListener('keydown', e => {
  if (e.keyCode === 13) {
    e.preventDefault()
    searchPharmacies(storeData)
  }
})
