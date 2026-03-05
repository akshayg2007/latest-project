"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { agreeToProject } from "./actions"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface AgreementProps {
    project: {
        id: string
        title: string
        description: string | null
        budget: number
        deadline: Date | null
        clientId: string
        freelancerId: string
    }
    agreementData: {
        clientAgreed: boolean
        freelancerAgreed: boolean
    }
    currentUserId: string
}

export function AgreementView({ project, agreementData, currentUserId }: AgreementProps) {
    const [isLoading, setIsLoading] = useState(false)
    const isClient = currentUserId === project.clientId
    const hasAgreed = isClient ? agreementData.clientAgreed : agreementData.freelancerAgreed

    const handleAgree = async () => {
        setIsLoading(true)
        try {
            await agreeToProject(project.id)
            toast.success("You agreed to the project terms.")
        } catch (error) {
            toast.error("Failed to update agreement.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto py-10 px-4">
            <h1 className="text-3xl font-bold mb-6">Project Agreement Phase</h1>
            <p className="text-muted-foreground mb-8">Before work can begin, both parties must agree to the terms below.</p>

            <Card>
                <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                        <span>{project.title}</span>
                        <Badge variant="outline" className="text-muted-foreground">Pending Agreement</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="prose max-w-none text-slate-700 space-y-4">
                    <h3>Project Scope</h3>
                    <p>{project.description || "No description provided."}</p>

                    <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mt-6">
                        <h4 className="flex items-center gap-2 mb-4 font-semibold text-slate-900">
                            <span className="text-xl">📜</span> Official Project Terms
                        </h4>
                        <ul className="list-disc pl-5 space-y-2 text-sm">
                            <li><strong>Deliverables:</strong> Defined in the proposal and project scope.</li>
                            <li><strong>Timeline:</strong> Fixed deadline: {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'N/A'}.</li>
                            <li><strong>Revisions:</strong> Up to 3 revisions included unless specified otherwise.</li>
                            <li><strong>Payment:</strong> Currently held in escrow and released upon milestone completion.</li>
                            <li><strong>Rights:</strong> Intellectual property rights transfer upon final payment.</li>
                        </ul>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mt-8">
                        <div className={`p-4 rounded-lg border flex items-center justify-between ${agreementData.clientAgreed ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                            <div>
                                <h5 className="font-semibold text-sm">Client (Rahul)</h5>
                                <p className="text-xs text-muted-foreground">{agreementData.clientAgreed ? 'Agreed' : 'Pending Review'}</p>
                            </div>
                            {agreementData.clientAgreed ? (
                                <Badge className="bg-green-600">Signed</Badge>
                            ) : (
                                <Badge variant="outline">Waiting</Badge>
                            )}
                        </div>
                        <div className={`p-4 rounded-lg border flex items-center justify-between ${agreementData.freelancerAgreed ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                            <div>
                                <h5 className="font-semibold text-sm">Freelancer (Aisha)</h5>
                                <p className="text-xs text-muted-foreground">{agreementData.freelancerAgreed ? 'Agreed' : 'Pending Review'}</p>
                            </div>
                            {agreementData.freelancerAgreed ? (
                                <Badge className="bg-green-600">Signed</Badge>
                            ) : (
                                <Badge variant="outline">Waiting</Badge>
                            )}
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end pt-6 border-t bg-slate-50/50">
                    <Button
                        size="lg"
                        className="bg-green-600 hover:bg-green-700 w-full md:w-auto"
                        onClick={handleAgree}
                        disabled={hasAgreed || isLoading}
                    >
                        {isLoading ? "Signing..." : hasAgreed ? "Waiting for other party..." : "I Agree to Terms"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
