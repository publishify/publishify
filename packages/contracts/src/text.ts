/** One definition for quota estimation and reported words. */
export const countWords=(text:string):number=>text.match(/[\p{L}\p{N}]+(?:['\u2019-][\p{L}\p{N}]+)*/gu)?.length??0;
