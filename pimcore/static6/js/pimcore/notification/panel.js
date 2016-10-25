/**
 * Pimcore
 *
 * This source file is available under two different licenses:
 * - GNU General Public License version 3 (GPLv3)
 * - Pimcore Enterprise License (PEL)
 * Full copyright and license information is available in
 * LICENSE.md which is distributed with this source code.
 *
 * @copyright  Copyright (c) 2009-2016 pimcore GmbH (http://www.pimcore.org)
 * @license    http://www.pimcore.org/license     GPLv3 and PEL
 *
 * @author Piotr Ćwięcek <pcwiecek@divante.pl>
 * @author Kamil Karkus <kkarkus@divante.pl>
 */
pimcore.registerNS("pimcore.notification.panel");
pimcore.notification.panel = Class.create({

    initialize: function () {
        this.getTabPanel();
    },

    activate: function () {
        var tabPanel = Ext.getCmp("pimcore_panel_tabs");
        tabPanel.setActiveItem("pimcore_notification_panel");
    },

    getTabPanel: function () {
        if (!this.panel) {
            var gridPanel = new Ext.Panel({
                id: 'gridPanel',
                region: 'center',
                items: [
                    this.getGrid()
                ]
            });

            this.panel = new Ext.Panel({
                id: "pimcore_notification_panel",
                title: t("notifications"),
                iconCls: "pimcore_icon_email",
                border: false,
                layout: 'border',
                closable: true,
                items: [
                    gridPanel
                ],
            });

            var tabPanel = Ext.getCmp("pimcore_panel_tabs");
            tabPanel.add(this.panel);
            tabPanel.setActiveItem("pimcore_notification_panel");


            this.panel.on("destroy", function () {
                pimcore.globalmanager.remove("notifications");
            }.bind(this));

            pimcore.layout.refresh();
        }

        return this.panel;
    },


    openDetails: function (id) {
        Ext.Ajax.request({
            url: "/admin/notification/details?id=" + id,
            success: function (response) {
                var response = Ext.decode(response.responseText);
                if (!response.success) {
                    return;
                }
                this.openDetailsWindow(response.data.id, response.data.title, response.data.message, response.data.type);
            }.bind(this)
        });
    },

    openDetailsWindow: function (id, title, message, type) {
        var notification = new Ext.Window({
            modal: true,
            iconCls: 'pimcore_icon_' + type,
            title: title,
            html: message,
            autoShow: true,
            width: 'auto',
            maxWidth: 700,
            closable: true,
            bodyStyle: "padding: 10px; background:#fff;",
            autoClose: false,
            listeners: {
                focusleave: function () {
                    this.close();
                },
                afterrender: function () {
                    pimcore.notification.helpers.markAsRead(id, function () {
                        this.reload();
                    }.bind(this));
                }.bind(this)
            }
        });
        notification.show(document);
        notification.focus();
    },
    getGrid: function () {
        var itemsPerPage = pimcore.helpers.grid.getDefaultPageSize();
        this.store = pimcore.helpers.grid.buildDefaultStore(
            '/admin/notification/list?',
            ["id", "title", "from", "date", "unread"],
            itemsPerPage
        );

        var typesColumns = [
            {header: "ID", flex: 1, sortable: false, hidden: true, dataIndex: 'id'},
            {
                header: t("title"),
                flex: 10,
                sortable: false,
                dataIndex: 'title',
                renderer: function (val, metaData, record, rowIndex, colIndex, store) {
                    var unread = parseInt(store.getAt(rowIndex).get("unread"));
                    if (unread) {
                        return '<strong>' + val + '</strong>';
                    }
                    return val;
                }
            },
            {header: t("from"), flex: 2, sortable: false, dataIndex: 'from'},
            {header: t("date"), flex: 3, sortable: false, dataIndex: 'date'},
            {
                xtype: 'actioncolumn',
                flex: 1,
                items: [
                    {
                        tooltip: t('open'),
                        icon: "/pimcore/static6/img/flat-color-icons/right.svg",
                        handler: function (grid, rowIndex) {
                            this.openDetails(grid.getStore().getAt(rowIndex).get("id"));
                        }.bind(this)
                    },
                    {
                        tooltip: t('mark_as_read'),
                        icon: '/pimcore/static6/img/flat-color-icons/checkmark.svg',
                        handler: function (grid, rowIndex) {
                            pimcore.notification.helpers.markAsRead(grid.getStore().getAt(rowIndex).get("id"), function () {
                                this.reload();
                            }.bind(this));
                        }.bind(this),
                        isDisabled: function (grid, rowIndex) {
                            return !parseInt(grid.getStore().getAt(rowIndex).get("unread"));
                        }.bind(this)
                    },
                    {
                        tooltip: t('delete'),
                        icon: '/pimcore/static6/img/flat-color-icons/delete.svg',
                        handler: function (grid, rowIndex) {
                            pimcore.notification.helpers.delete(grid.getStore().getAt(rowIndex).get("id"), function () {
                                this.reload();
                            }.bind(this));
                        }.bind(this)
                    }

                ]
            }
        ];

        this.pagingtoolbar = pimcore.helpers.grid.buildDefaultPagingToolbar(this.store);

        var toolbar = Ext.create('Ext.Toolbar', {
            cls: 'main-toolbar',
            items: [
                {
                    text: t("delete_all"),
                    iconCls: "pimcore_icon_delete",
                    handler: function() {
                        pimcore.notification.helpers.deleteAll(function () {
                            this.reload();
                        }.bind(this));
                    }.bind(this)
                }
            ]
        });

        this.grid = new Ext.grid.GridPanel({
            frame: false,
            autoScroll: true,
            store: this.store,
            columns: typesColumns,
            trackMouseOver: true,
            bbar: this.pagingtoolbar,
            columnLines: true,
            stripeRows: true,
            listeners: {
                "itemdblclick": function (grid, record, tr, rowIndex, e, eOpts) {
                    this.openDetails(record.data.id);
                }.bind(this)

            },
            viewConfig: {
                forceFit: true
            },
            tbar: toolbar
        });

        return this.grid;
    },

    reload: function () {
        this.store.reload();
    },
});
