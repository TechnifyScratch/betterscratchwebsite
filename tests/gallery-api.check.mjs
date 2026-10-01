import test from 'node:test';
import assert from 'node:assert/strict';
import {recentProjects} from '../api/gallery.js';
const project = (id, created) => ({id,title:'A project',author:{username:'Scratcher'},history:{created}});
test('gallery uses a rolling five-year creation window and rejects invalid projects', () => {
 const now = new Date('2026-10-01T12:00:00Z');
 const result = recentProjects([
  project(1,'2021-10-01T12:00:00Z'), project(2,'2021-10-01T11:59:59Z'),
  project(3,'2026-10-01T12:00:00Z'), project(4,'2026-10-01T12:00:01Z'),
  project(1,'2025-01-01'), project(5,'invalid'), project(-1,'2025-01-01'),
  {...project(6,'2025-01-01'),author:{username:'bad/name'}}
 ],now);
 assert.deepEqual(result.map(p=>p.id),[1,3]);
 assert.equal(recentProjects(null,now).length,0);
});
