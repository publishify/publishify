import {describe,it,expect} from 'vitest';
import {countWords} from '../src/text';
describe('shared quota counting',()=>{
 it('handles punctuation and typographic separators consistently',()=>{expect(countWords('one\u2013two')).toBe(2);expect(countWords("writer's well-known book")).toBe(3);expect(countWords('# Title\n\nOne, two.')).toBe(3);});
 it('does not count markup as words',()=>{expect(countWords('*** \n #')).toBe(0);});
});
