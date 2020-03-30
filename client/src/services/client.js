import axios from 'axios'

export async function getArchetypes () {
    let response = await axios.get('https://db.ygoprodeck.com/api/v6/archetypes.php')
    return response.data
}
