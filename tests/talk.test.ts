import { describe, expect, it } from 'vitest';
import { splitStory } from '../src/ui/split';

describe('splitStory', () => {
  it('讀出表情標記，且不顯示標記', () => {
    const lines = splitStory('阿秀嬸說：「{sad}每晚子時哭。」', { name: '阿秀嬸', tex: 'x' });
    expect(lines.at(-1)).toMatchObject({ name: '阿秀嬸', expr: 'sad', text: '「每晚子時哭。」' });
  });
  it('「阿城的阿嬤」在故事裡寫成「阿嬤」也算她說的', () => {
    const lines = splitStory('金光一閃，阿嬤坐了起來：「{smile}阿城，我肚子餓。」', { name: '阿城的阿嬤' });
    expect(lines.at(-1)).toMatchObject({ name: '阿城的阿嬤', expr: 'smile' });
  });
  it('別人說的話不算，標記也拿掉', () => {
    const lines = splitStory('阿土伯拍拍他的肩：「{sad}你阿公也猶豫過。」', { name: '阿哲' });
    expect(lines.at(-1)).toEqual({ text: '「你阿公也猶豫過。」' });
  });
});
