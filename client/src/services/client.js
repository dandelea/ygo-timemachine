import axios from 'axios'

export async function getStats() {
    let response = await axios.get('/api/stats')
    return response.data
}

export async function getArchetypes() {
    let response = await axios.get('/api/archetypes')
    return response.data
}

export async function getCard(id) {
    let response = await axios.get(`/api/cards/${id}`)
    return response.data
}

export async function getCards(form) {
    let response = await axios.post('/api/cards', form)
    return response.data
}
