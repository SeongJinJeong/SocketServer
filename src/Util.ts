class Util {
    public static generateResponse(onerror: boolean, param?: { [key: string]: any }) {
        var data = param || {};
        return {
            code: onerror ? 400 : 200,
            ...data
        }
    }
}
export default Util;