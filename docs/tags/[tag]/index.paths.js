import fs from 'fs'
import { globSync } from 'glob'

var tags = {}

var files = globSync("docs/posts/**/*.md");

files.forEach(file => {
    var data = fs.readFileSync(file, 'utf8');
    var found = data.match(/^tags:\s*\[(.+)]\s*$/m)
    console.log(found)
    if (found) {
        console.log(found[1])
        found[1].split(",")
            .map(tag => { return tag.replaceAll('"', '') })
            .forEach(tag => {
                tags[tag.replaceAll(' ', '')] = tag
            })
    }
});

export default {
    paths: () => {
        return Object.keys(tags).map((key) => {
            return { params: { tag: key }, content: `# ${tags[key]}`}
        })
    }
}

