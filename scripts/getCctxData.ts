import axios from 'axios';

const BASE_URL = 'https://zetachain-athens.blockpi.network/lcd/v1/public/zeta-chain';

/**
 * Get CCTX (Cross-Chain Transaction) data by inbound hash.
 * @param hashTx Transaction hash (e.g.: 0x04b8...0231)
 */
export async function getCctxByInboundHash(hashTx: string): Promise<void | null> {
  try {
    const url = `${BASE_URL}/crosschain/inboundHashToCctxData/${hashTx}`;
    const response = await axios.get(url);

    console.log('\n✅ Result:\n', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    if (error.response) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;

      console.error(`\n❌ API returned the error: ${status}`);
      console.error(`💬 Message: ${message}`);
    } else {
      console.error('❌ Request error:', error.message);
    }
    return null;
  }
}