/// <reference path="../../playlist/model/playlist.ts" />

namespace HTML5AudioPlayer.Components.Models {

    export class KnowledgeCheckList extends Backbone.Model {

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

            let model: KnowledgeCheckList = this;

            model.Current = null;
            //model.UserAnswers = new Array<string>();
            //model.UserCorrectAnswers = new Array<string>();
            //model.CurrentCuePoints = new Array<string>();

            //model.CuePoints = new Array<DataStructures.CuePoint>();

        }






    }
}
