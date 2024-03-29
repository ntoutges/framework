import { Grid, Pos } from "./module/pos.js";
import { Scene } from "./module/scene.js";
import { AddonTest } from "./module/addons/addons.js";
import { DraggableWidget } from "./module/widgets/draggable-widget.js";
import { GridWidget } from "./module/widgets/grid.js";
import { ConnectorAddon } from "./module/addons/connector.js";
import { AttachableListener } from "./module/attachableListener.js";
import { Listener } from "./module/listener.js";
import { BasicWire } from "./module/widgets/wire.js";
import { ConnDisplay, ConnInput, ConnWidget } from "./module/widgets/connWidget.js";
import { PeerConnection } from "./connection/lib/distros/peer.js";
import { FAnimation } from "./module/animation.js";

ConnectorAddon.setStyle("data", "input", { background: "white" });
ConnectorAddon.setStyle("data", "output", { background: "black" });
ConnectorAddon.setStyle("data", "omni", { background: "radial-gradient(black, black 50%, white 50%, white)" });

const $ = document.querySelector.bind(document);

declare const Peer: any;

const clientId = location.search.substring(1).split(":")[0];
const routerId = location.search.substring(1).split(":")[1] ?? null;

const conn = new PeerConnection(Peer, "fw");
const client = conn.buildClient(clientId);
if (routerId) client.routerId = routerId;

client.listener.on("connect", (data) => { console.log("connect:",data) });
client.listener.on("disconnect", (data) => { console.log("disconnect:",data) });

const channel = client.buildChannel("default");

const scene2Holder = document.createElement("div");
const scene3Holder = document.createElement("div");
// const widget2 = new DraggableWidget({
//   content: document.createElement("div"),
//   name: "syncs",
//   header: {
//     title: "Sender"
//   },
//   addons: {
//     main: {
//       side: "right",
//       addon: new ConnectorAddon<"output" | "input" | "omni">({
//         direction: "output",
//         type: "data",
//         validator: connValidator
//       })
//     }
//   },
//   style: {
//     "width": "100px",
//     "height": "50px"
//   },
//   doDragAll: true
// })

const scene = new Scene({
  parent: $("#sandbox"),
  style: {
    // width: "100vw",
    // height: "100vh",
    background: "white"
  },
  doStartCentered: true,
  options: {
    // scrollX: false,
    // scrollY: false
    zoom: {
      max: 1e2,
      min: 1e-2
    }
  },
  widgets: [
    new GridWidget({
      style: {
        background: "cornsilk"
      },
      options: {
        coords: true
      },
      doCursorDragIcon: true
    }),
    
    // new ConnDisplay(),
    // new ConnInput(),
    // new ConnWidget(channel),
    new DraggableWidget({
      content: scene2Holder,
      name: "scene-holders",
      header: {
        "title": "Scene Holder",
        buttons: {
          maximize: {
            show: true
          }
        }
      },
      style: {
        width: "50vw",
        height: "50vh"
      },
      resize: "both"
    })
  ]
});

// connW.pos.animatePos(
//   new FAnimation({ time: 5000 }),
//   { "x": 100, "y": 100 }
// )

// setInterval(() => {
  // (widget2.addons.get("main") as ConnectorAddon<"output" | "input" | "omni">).sender.trigger("send", "clock pulse");
// }, 100);

// (widget1.addons.get("main") as ConnectorAddon<"output" | "input" | "omni">).sender.on("connect", (data) => { console.log(data, "connect") });
// (widget1.addons.get("main") as ConnectorAddon<"output" | "input" | "omni">).sender.on("receive", (data) => { console.log(data) });
// (widget1.addons.get("main") as ConnectorAddon<"output" | "input" | "omni">).sender.on("disconnect", (data) => { console.log(data, "disconencted") });

function connValidator(dir1: "input" | "output" | "omni", dir2: "input" | "output" | "omni") {
  return (dir1 == "input" && dir2 == "output") || (dir1 == "output" && dir2 == "input") || (dir1 == "omni") || (dir2 == "omni")
}

const scene2 = new Scene({
  parent: scene2Holder,
  encapsulator: scene,
  doStartCentered: true,
  widgets: [
    new GridWidget({
      doCursorDragIcon: true
    }),
    new DraggableWidget({
      content: scene3Holder,
      name: "scene-holders",
      header: {
        "title": "Scene Holder",
        buttons: {
          maximize: {
            show: true
          }
        }
      },
      style: {
        width: "40vw",
        height: "20vh"
      },
      resize: "both"
    })
  ]
})

new Scene({
  parent: scene3Holder,
  encapsulator: scene2,
  doStartCentered: true,
  widgets: [
    new GridWidget({})
  ]
})
