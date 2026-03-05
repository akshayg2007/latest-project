const fs = require('fs');

function formatStep(stepNum, content, backText, nextText, nextProps) {
    return `                                {step === ${stepNum} && (
                                    <motion.div
                                        key="step${stepNum}"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-6"
                                    >
${content}
                                        <div className="flex justify-end gap-2 pt-4">
                                            <Button
                                                variant="outline"
                                                onClick={${stepNum === 1 ? '() => router.back()' : 'prevStep'}}
                                                className="h-10 px-6 rounded-full border-slate-200 font-bold text-slate-800 text-sm hover:bg-slate-50 outline-none"
                                            >
                                                ${backText}
                                            </Button>
                                            <Button
                                                className="h-10 px-${nextText === 'Publish' ? '10' : '8'} rounded-full bg-black hover:bg-black/90 text-white font-bold text-sm${nextText === 'Publish' ? ' min-w-[140px] flex items-center justify-center gap-2' : ''}"
                                                onClick={${nextText === 'Publish' ? 'handlePublish' : 'nextStep'}}
                                                ${nextProps}
                                            >
${nextText === 'Publish' ? `                                                {isPublishing ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        <span>Please wait...</span>
                                                    </>
                                                ) : "Publish"}` : `                                                ${nextText}`}
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}`;
}

const lines = fs.readFileSync('app/services/create/page.tsx', 'utf-8').split('\n');
const getLines = (start, end) => lines.slice(start - 1, end).join('\n');

const category = getLines(346, 373);
const title = getLines(375, 389);
const summary = getLines(676, 690);

const deliverables = getLines(609, 647);
const revisions = getLines(536, 577);

const deliveryTime = getLines(790, 838);

const pricing = getLines(868, 1155);

const tools = getLines(391, 416);
const tags = getLines(579, 607);
const faqs = getLines(703, 758);

const image = getLines(446, 507);

const step1 = formatStep(1, [category, title, summary].join('\n\n'), 'Cancel', 'Next', 'disabled={!formData.category || !formData.title || !formData.summary}');
const step2 = formatStep(2, [deliverables, revisions].join('\n\n'), 'Previous', 'Next', '');
const step3 = formatStep(3, deliveryTime, 'Previous', 'Next', '');
const step4 = formatStep(4, pricing, 'Previous', 'Next', `disabled={((formData.pricingMethod === 'ongoing' || formData.pricingMethod === 'fixed') && !formData.rate) || (formData.pricingMethod === 'ongoing' && formData.paymentSteps.length > 0 && totalPercentage !== 100)}`);
const step5 = formatStep(5, [tools, tags, faqs].join('\n\n'), 'Previous', 'Next', '');
const step6 = formatStep(6, image, 'Previous', 'Publish', `disabled={isPublishing}`);

const beginning = lines.slice(0, 335).join('\n');
const fixedBeginning = beginning.replace('setStep(2)', 'setStep(6)');

const end = lines.slice(1179).join('\n');

const newContent = [fixedBeginning, step1, step2, step3, step4, step5, step6, end].join('\n');

fs.writeFileSync('app/services/create/page.tsx', newContent);
console.log('Done replacing steps!');
