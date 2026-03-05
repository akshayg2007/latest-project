const fs = require('fs');

const file = 'app/dashboard/explore/services/[id]/page.tsx';
const lines = fs.readFileSync(file, 'utf-8').split('\n');

// Find and inject 'Tag' icon in the lucide-react import
const lucideLineIndex = lines.findIndex(l => l.includes('GitPullRequest'));
if (lucideLineIndex !== -1 && !lines[lucideLineIndex].includes('Tag')) {
    lines[lucideLineIndex] = lines[lucideLineIndex].replace('GitPullRequest', 'GitPullRequest,\n    Tag');
}

const getLines = (start, end) => lines.slice(start - 1, end).join('\n');

const beforeDesc = getLines(1, 279);
const desc = getLines(280, 285);
const roadmap = getLines(286, 337);
const deliverables = getLines(339, 360);
const tools = getLines(362, 377);
const faqs = getLines(379, 399);
const rest = getLines(401, lines.length);

const tagsSection = `
                        {/* Tags */}
                        {service.tags && service.tags.length > 0 && (
                            <div className="space-y-3 pt-4 border-t">
                                <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                                    <Tag className="w-4 h-4 text-primary" />
                                    Search Tags
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {service.tags.map((tag: string, idx: number) => (
                                        <span key={idx} className="px-2.5 py-1 bg-secondary text-secondary-foreground rounded-md text-xs font-medium">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}`;

const sections = [
    beforeDesc,
    desc,
    deliverables,
    roadmap,
    tools,
    tagsSection,
    faqs,
    rest
];

const newContent = sections.join('\n');
fs.writeFileSync(file, newContent);
console.log('Reordered service details page successfully!');
