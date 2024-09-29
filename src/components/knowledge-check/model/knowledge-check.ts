/// <reference path="../../playlist/model/playlist.ts" />

namespace HTML5AudioPlayer.Components.Models {

    export class KnowledgeCheck extends Backbone.Model {

        // enabled
        get Enabled(): string { return this.get("enabled"); }
        set Enabled(value: string) { this.set("enabled", value); }

        get CuePointDelta(): number { return this.get("cuepointdelta"); }
        set CuePointDelta(value: number) { this.set("cuepointdelta", value); }

        get CuePoints(): DataStructures.CuePoint[] { return this.get("CuePoints"); }
        set CuePoints(value: DataStructures.CuePoint[]) { this.set("CuePoints", value); }

        // get CurrentCuePoints(): DataStructures.CuePoint[] { return this.get("currentCuePoints"); }
        // set CurrentCuePoints(value: DataStructures.CuePoint[]) { this.set("currentCuePoints", value); }

        get KnowledgeChecks(): DataStructures.KCData[] { return this.get("knowledgechecksdata"); }
        set KnowledgeChecks(value: DataStructures.KCData[]) { this.set("knowledgechecksdata", value); }

        get Knowledgechecksdata(): DataStructures.KCData[] { return this.get("Knowledgechecksdata"); }
        set Knowledgechecksdata(value: DataStructures.KCData[]) { this.set("Knowledgechecksdata", value); }

        get Current(): DataStructures.KCData { return this.get("current"); }
        set Current(value: DataStructures.KCData) { this.set("current", value); }

        get UserAnswers(): string[] { return this.get("UserAnswers"); }
        set UserAnswers(value: string[]) { this.set("UserAnswers", value); }

        get UserCorrectAnswers(): string[] { return this.get("UserCorrectAnswers"); }
        set UserCorrectAnswers(value: string[]) { this.set("UserCorrectAnswers", value); }

        get CurrentCuePoints(): DataStructures.CuePoint[] { return this.get("CurrentCuePoints"); }
        set CurrentCuePoints(value: DataStructures.CuePoint[]) { this.set("CurrentCuePoints", value); }




        constructor(options: any) {
            super(options);


            let model: KnowledgeCheck = this;

            model.Current = null;
            model.UserAnswers = new Array<string>();
            model.UserCorrectAnswers = new Array<string>();
            //model.CurrentCuePoints = new Array<string>();

            model.CuePoints = new Array<DataStructures.CuePoint>();
            if (model.Enabled) {
                for (let i: number = 0; i < model.KnowledgeChecks.length; i++) {
                    let cp: DataStructures.CuePoint = new DataStructures.CuePoint();

                    cp.id = model.KnowledgeChecks[i].id;

                    switch (model.KnowledgeChecks[i].time) {
                        case "start":
                            cp.time = DataStructures.KCWhen.Start;
                            break;
                        case "end":
                            cp.time = DataStructures.KCWhen.End;
                            break;
                        default:
                            cp.time = parseFloat(model.KnowledgeChecks[i].time);
                            break;
                    }
                    cp.audio = model.KnowledgeChecks[i].audio;

                    model.CuePoints.push(cp);

                    model.KnowledgeChecks[i].inputtype = (model.KnowledgeChecks[i].type === DataStructures.KCType.MCSS ? "radio" : "checkbox");

                    model.KnowledgeChecks[i].usedattempts = 0;

                    if (model.KnowledgeChecks[i].feedback.generic) {
                        model.KnowledgeChecks[i].feedback.type = DataStructures.KCFeedbackType.Generic;
                    }
                    else if (model.KnowledgeChecks[i].feedback.individual) {
                        model.KnowledgeChecks[i].feedback.type = DataStructures.KCFeedbackType.Individual;
                    }
                    else {
                        console.error("No feedback found for Knoledge Check: ", model.KnowledgeChecks[i].id + "\n" + model.KnowledgeChecks[i].question);
                    }
                }
            }
        }

        public getCuePoints(audioId: string): DataStructures.CuePoint[] {
            let model: KnowledgeCheck = this;

            return model.CuePoints.filter((cp: DataStructures.CuePoint) => {
                return cp.audio === audioId;
            });
        }

        public setCurrentKC(id: string): void {
            let model: KnowledgeCheck = this;

            model.Current = model.KnowledgeChecks.filter((kc: DataStructures.KCData) => {
                return id === kc.id;
            })[0];
        }

        public getCurrentCuePointsById(id: string): DataStructures.CuePoint[] {
            let model: KnowledgeCheck = this;
            return model.CurrentCuePoints = model.CuePoints.filter(item => item.id === id);
        }



        public getCurrentCuePoints(id: string): DataStructures.CuePoint[] {
            let model: KnowledgeCheck = this;
            return model.CurrentCuePoints = model.CuePoints.filter(item => item.audio === id);
            //console.log(model.CurrentCuePoints)

            // return model.CuePoints.filter((cp: DataStructures.CuePoint) => {
            //     return cp.audio === id;
            // });
        }

        public setIndex(num: number) {
            let model: KnowledgeCheck = this;
            model.Current.index=num;
            // model.Current.index=num;
            // return model.Current.index;
            // //console.log(model.CurrentCuePoints)

            // // return model.CuePoints.filter((cp: DataStructures.CuePoint) => {
            // //     return cp.audio === id;
            // // });
        }


    }
}
